import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prismaClient";
import { WebhookSignatureValidatorWrapper } from "@/infrastructure/providers/webhook-signature-validator";
import { TransitionOrderStatus } from "@/domain/order/use-cases/transition-order-status";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { sendOrderEmailAsync } from "@/lib/email/send-order-emails";

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
  console.log("\n========== WEBHOOK START ==========");
  console.log("Timestamp:", new Date().toISOString());
  console.log("URL:", request.url);

  try {
    // Parse body
    console.log("[1/6] Parsing request body...");
    const body = await request.json();
    console.log("[1/6] Body parsed successfully");

    // Extract headers
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const dataId = body.data?.id;

    console.log("[1/6] Headers:", {
      "x-signature": xSignature ? "present" : "missing",
      "x-request-id": xRequestId || "missing",
      "data.id": dataId || "missing",
    });

    // Step 1: Validate signature
    console.log("[2/6] Validating signature...");
    const isProduction = process.env.NODE_ENV === "production";
    console.log("[2/6] Environment:", isProduction ? "PRODUCTION" : "DEVELOPMENT");

    if (isProduction) {
      if (!process.env.MP_WEBHOOK_SECRET) {
        console.error("[2/6] ERROR: MP_WEBHOOK_SECRET not configured");
        return NextResponse.json(
          { error: "Webhook secret not configured" },
          { status: 500 }
        );
      }

      try {
        WebhookSignatureValidatorWrapper.validate({
          xSignature,
          xRequestId,
          dataId: dataId ? String(dataId) : undefined,
          secret: process.env.MP_WEBHOOK_SECRET!,
        });
        console.log("[2/6] ✅ Signature valid");
      } catch (error) {
        console.error("[2/6] ❌ Signature validation failed:", error);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    } else {
      console.log("[2/6] ⚠️  Skipping signature validation (development mode)");
    }

    // Step 2: Extract event info
    console.log("[3/6] Extracting event info...");
    const url = new URL(request.url);
    const topic = url.searchParams.get("topic");
    const idFromUrl = url.searchParams.get("id");
    const dataIdFromUrl = url.searchParams.get("data.id");

    console.log("[3/6] URL params:", { topic, id: idFromUrl, "data.id": dataIdFromUrl });
    console.log("[3/6] Body fields:", {
      id: body.id,
      action: body.action,
      type: body.type,
      "data.id": body.data?.id,
    });

    const eventId = body.id || idFromUrl || dataIdFromUrl;
    const action = body.action || (topic === "payment" ? "payment.updated" : topic);

    console.log("[3/6] Extracted:", { eventId, action, topic, isLegacy: !!topic });

    if (!eventId) {
      console.error("[3/6]  Missing event ID");
      console.error("[3/6] Body:", JSON.stringify(body, null, 2));
      console.error("[3/6] URL:", request.url);
      return NextResponse.json(
        { error: "Missing event ID", details: "No se encontró ID del evento en body ni URL" },
        { status: 400 }
      );
    }

    console.log("[3/6] ✅ Event info extracted:", { eventId, action });

    // Step 3: Deduplicate
    console.log("[4/6] Checking for duplicate...");
    const existingLog = await prisma.webhookLog.findFirst({
      where: {
        provider: "MERCADOPAGO",
        event: String(eventId),
        processed: true,
      },
    });

    if (existingLog) {
      console.log("[4/6] ️  Duplicate detected (already processed)");
      return NextResponse.json({ ok: true, deduplicated: true, eventId }, { status: 200 });
    }

    console.log("[4/6] ✅ No duplicate found");

    // Create log entry
    console.log("[4/6] Creating webhook log entry...");
    const log = await prisma.webhookLog.create({
      data: {
        provider: "MERCADOPAGO",
        event: String(eventId),
        payload: body,
        processed: false,
      },
    });
    console.log("[4/6] ✅ Log entry created:", log.id);

    // Step 4: Process event
    console.log("[5/6] Processing event...");
    try {
      if (action === "payment.updated" || action === "payment.created" || action === "payment") {
        const paymentId = topic === "payment" ? eventId : (dataId || dataIdFromUrl || eventId);
        console.log("[5/6] Payment event detected, processing payment ID:", paymentId);
        await processPaymentEvent(body, paymentId);
      } else if (action === "merchant_order" || topic === "merchant_order") {
        console.log("[5/6] ⚠️  Merchant order event detected, skipping (payment event will handle it)");
        console.log("[5/6] Event ID:", eventId);
      } else {
        console.log("[5/6] ️  Unhandled action:", action);
        console.log("[5/6] Topic:", topic);
        console.log("[5/6] Full body:", JSON.stringify(body, null, 2));
      }

      // Mark as processed
      console.log("[5/6] Marking log as processed...");
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { processed: true },
      });
      console.log("[5/6] ✅ Log marked as processed");

      console.log("========== WEBHOOK END (SUCCESS) ==========\n");
      return NextResponse.json({ ok: true, eventId }, { status: 200 });
    } catch (processingError) {
      console.error("[5/6] ❌ Processing error:", processingError);

      // Mark log as not processed
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { processed: false },
      });
      console.log("[5/6] Log marked as failed (will retry)");

      console.log("========== WEBHOOK END (ERROR) ==========\n");
      return NextResponse.json(
        { error: "Processing failed", details: processingError instanceof Error ? processingError.message : "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("========== WEBHOOK END (CRITICAL ERROR) ==========");
    console.error("Critical error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    console.log("===================================================\n");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
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
  console.log("[processPaymentEvent] Starting...");
  console.log("[processPaymentEvent] Payment ID:", paymentId);

  // Check if MP_ACCESS_TOKEN is configured
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN not configured in environment");
  }

  // Fetch payment from MP API
  console.log("[processPaymentEvent] Fetching payment from MP API...");
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const paymentClient = new Payment(client);

  let payment;
  try {
    payment = await paymentClient.get({ id: String(paymentId) });
    console.log("[processPaymentEvent] ✅ Payment fetched successfully");
  } catch (error) {
    console.error("[processPaymentEvent] ❌ Failed to fetch payment:", error);
    if (error instanceof Error && error.message.includes("not_found")) {
      throw new Error(`Payment ${paymentId} not found in MercadoPago (may be expired or invalid)`);
    }
    throw error;
  }

  console.log("[processPaymentEvent] Payment details:", {
    id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail,
    external_reference: payment.external_reference,
    transaction_amount: payment.transaction_amount,
  });

  const paymentStatus = payment.status;

  if (!paymentStatus) {
    throw new Error(`Payment ${paymentId} response missing status field`);
  }

  const externalReference = payment.external_reference;

  if (!externalReference) {
    throw new Error(`Payment ${paymentId} missing external_reference (cannot find order)`);
  }

  const orderId = parseInt(externalReference, 10);
  if (isNaN(orderId)) {
    throw new Error(`Invalid external_reference: "${externalReference}" (not a number)`);
  }

  console.log("[processPaymentEvent] Order ID from external_reference:", orderId);

  // Find order in database
  console.log("[processPaymentEvent] Looking up order in database...");
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Order #${orderId} not found in database (external_reference: ${externalReference})`);
  }

  console.log("[processPaymentEvent] ✅ Order found:", {
    id: order.id,
    status: order.status,
    total: order.total,
    items: order.items.length,
  });

  // Map payment status to order transition
  console.log("[processPaymentEvent] Mapping payment status:", paymentStatus);
  const transition = mapPaymentStatusToTransition(paymentStatus);

  if (!transition) {
    console.log(`[processPaymentEvent] ⚠️  No transition needed for status "${paymentStatus}" on order #${orderId}`);
    console.log("[processPaymentEvent] Order will remain in current status:", order.status);
    return;
  }

  // Idempotency: if order is already in the target status, skip silently
  if (order.status === transition.newStatus) {
    console.log(`[processPaymentEvent] ️  Order #${orderId} already ${transition.newStatus} (idempotent, skipping)`);
    return;
  }

  console.log("[processPaymentEvent] Transition:", `${order.status} → ${transition.newStatus}`);

  // Execute transition
  console.log("[processPaymentEvent] Executing transition...");
  const useCase = new TransitionOrderStatus();
  await useCase.execute({
    orderId,
    newStatus: transition.newStatus,
    trigger: "webhook",
    paymentId: String(paymentId),
    reason: `MercadoPago ${body.action || "webhook"} — status: ${paymentStatus}`,
  });

  console.log(`[processPaymentEvent] ✅ Order #${orderId} transitioned to ${transition.newStatus}`);
  console.log(`[processPaymentEvent] Payment ID: ${paymentId}`);
  console.log(`[processPaymentEvent] Payment status: ${paymentStatus}`);

  if (transition.newStatus === "PAID") {
    try {
      const orderWithAddress = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: { select: { name: true } } } },
          shippingAddress: true,
        },
      });
      if (orderWithAddress) {
        sendOrderEmailAsync("order.paid", {
          orderNumber: orderWithAddress.id,
          customerName: orderWithAddress.fullName,
          customerEmail: orderWithAddress.email,
          items: orderWithAddress.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          total: Number(orderWithAddress.total),
          shippingAddress: {
            line1: orderWithAddress.shippingAddress.line1,
            line2: orderWithAddress.shippingAddress.line2 ?? undefined,
            city: orderWithAddress.shippingAddress.city,
            province: orderWithAddress.shippingAddress.province,
            postalCode: orderWithAddress.shippingAddress.postalCode,
            country: orderWithAddress.shippingAddress.country,
          },
        });
      }
    } catch (emailError) {
      console.error("[processPaymentEvent] Failed to send PAID email (non-blocking):", emailError);
    }
  }
}

/**
 * Map MercadoPago payment status to our order transition.
 */
function mapPaymentStatusToTransition(
  mpStatus: string
): { newStatus: string } | null {
  console.log("[mapPaymentStatusToTransition] Mapping status:", mpStatus);

  switch (mpStatus) {
    case "approved":
    case "authorized":
      console.log("[mapPaymentStatusToTransition] → PAID");
      return { newStatus: "PAID" };

    case "rejected":
    case "cancelled":
      console.log("[mapPaymentStatusToTransition] → CANCELLED");
      return { newStatus: "CANCELLED" };

    case "pending":
    case "in_process":
    case "in_mediation":
      console.log("[mapPaymentStatusToTransition] → No transition (stays RESERVED)");
      return null;

    case "refunded":
    case "charged_back":
      console.log("[mapPaymentStatusToTransition] → REFUNDED");
      return { newStatus: "REFUNDED" };

    default:
      console.warn(`[mapPaymentStatusToTransition] ⚠️  Unknown status: "${mpStatus}"`);
      return null;
  }
}
