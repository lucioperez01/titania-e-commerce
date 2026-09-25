import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prismaClient";
import { WebhookSignatureValidatorWrapper } from "@/infrastructure/providers/webhook-signature-validator";
import { TransitionOrderStatus } from "@/domain/order/use-cases/transition-order-status";
import MercadoPagoConfig, { Payment } from "mercadopago";

/**
 * MercadoPago Webhook Handler
 *
 * Flow:
 * 1. Validate signature using WebhookSignatureValidatorWrapper
 * 2. Deduplicate via WebhookLog
 * 3. Process payment events (payment.updated, payment.created)
 * 4. Transition order status based on payment status
 * 5. Mark WebhookLog as processed
 */
export async function POST(request: Request) {
  try {
    // Parse body first (needed for signature validation)
    const body = await request.json();

    // Extract headers for signature validation
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const dataId = body.data?.id;

    // Step 1: Validate signature
    try {
      WebhookSignatureValidatorWrapper.validate({
        xSignature,
        xRequestId,
        dataId: dataId ? String(dataId) : undefined,
        secret: process.env.MP_WEBHOOK_SECRET!,
      });
    } catch (error) {
      console.error("Webhook signature validation failed:", error);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Step 2: Extract event info
    const eventId = body.id;
    const action = body.action; // payment.updated, payment.created, etc.

    if (!eventId) {
      console.error("Webhook missing event ID");
      return NextResponse.json(
        { error: "Missing event ID" },
        { status: 400 }
      );
    }

    // Step 3: Deduplicate via WebhookLog
    const existingLog = await prisma.webhookLog.findFirst({
      where: {
        provider: "MERCADOPAGO",
        event: String(eventId),
        processed: true,
      },
    });

    if (existingLog) {
      // Already processed — return 200 immediately (idempotent)
      return NextResponse.json({ ok: true, deduplicated: true }, { status: 200 });
    }

    // Create log entry BEFORE processing (so we have a record even if processing fails)
    const log = await prisma.webhookLog.create({
      data: {
        provider: "MERCADOPAGO",
        event: String(eventId),
        payload: body,
        processed: false,
      },
    });

    // Step 4: Process event
    try {
      if (action === "payment.updated" || action === "payment.created") {
        await processPaymentEvent(body, dataId);
      } else {
        console.log(`Webhook: unhandled action "${action}"`);
      }

      // Step 5: Mark as processed
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { processed: true },
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (processingError) {
      // Mark log as not processed (so MP retries and we can reprocess)
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { processed: false },
      });

      console.error("Webhook processing error:", processingError);
      return NextResponse.json(
        { error: "Processing failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Process a payment event from MercadoPago.
 * Fetches the full payment object from MP API (webhooks only send data.id),
 * finds the order by external_reference (orderId) and transitions it.
 */
async function processPaymentEvent(body: Record<string, unknown>, paymentId: string | number): Promise<void> {
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: String(paymentId) });

  const paymentStatus = payment.status;

  if (!paymentStatus) {
    throw new Error("MercadoPago payment response missing status");
  }

  const externalReference = payment.external_reference;

  if (!externalReference) {
    throw new Error("Webhook payment event missing external_reference");
  }

  const orderId = parseInt(externalReference, 10);
  if (isNaN(orderId)) {
    throw new Error(`Invalid external_reference: ${externalReference}`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Order #${orderId} not found for webhook event`);
  }

  const transition = mapPaymentStatusToTransition(paymentStatus);

  if (!transition) {
    console.log(`Webhook: no transition for payment status "${paymentStatus}" on order #${orderId}`);
    return;
  }

  const useCase = new TransitionOrderStatus();
  await useCase.execute({
    orderId,
    newStatus: transition.newStatus,
    trigger: "webhook",
    paymentId: String(paymentId),
    reason: `MercadoPago ${body.action} — status: ${paymentStatus}`,
  });

  console.log(
    `Webhook: Order #${orderId} transitioned to ${transition.newStatus} (payment: ${paymentStatus})`
  );
}

/**
 * Map MercadoPago payment status to our order transition.
 */
function mapPaymentStatusToTransition(
  mpStatus: string
): { newStatus: string } | null {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return { newStatus: "PAID" };

    case "rejected":
    case "cancelled":
      return { newStatus: "CANCELLED" };

    case "pending":
    case "in_process":
    case "in_mediation":
      // No transition needed — order stays RESERVED
      return null;

    case "refunded":
    case "charged_back":
      return { newStatus: "REFUNDED" };

    default:
      console.warn(`Unknown MP payment status in webhook: ${mpStatus}`);
      return null;
  }
}
