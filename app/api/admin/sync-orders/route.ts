import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prismaClient";
import { TransitionOrderStatus } from "@/domain/order/use-cases/transition-order-status";
import MercadoPagoConfig, { Payment } from "mercadopago";

/**
 * Sync orders endpoint - polls MercadoPago for payment status
 * Call this endpoint to sync all RESERVED orders with MP payment status
 */
export async function POST() {
  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const paymentClient = new Payment(client);
    const transitionUseCase = new TransitionOrderStatus();

    // Find all RESERVED orders
    const reservedOrders = await prisma.order.findMany({
      where: { status: "RESERVED" },
      include: { items: true },
    });

    console.log(`Syncing ${reservedOrders.length} RESERVED orders...`);

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of reservedOrders) {
      try {
        if (!order.preferenceId) {
          console.log(`Order #${order.id} has no preferenceId, skipping`);
          continue;
        }

        // Get the preference from MP to find the payment ID
        // We need to search payments by external_reference (order ID)
        const payments = await paymentClient.search({
          options: {
            external_reference: String(order.id),
            status: "approved",
          },
        });

        const approvedPayment = payments.results?.[0];

        if (approvedPayment) {
          console.log(`Order #${order.id}: Payment found - ${approvedPayment.id}`);

          // Transition order to PAID
          await transitionUseCase.execute({
            orderId: order.id,
            newStatus: "PAID",
            trigger: "webhook",
            paymentId: approvedPayment.id,
            reason: `Payment approved via sync: ${approvedPayment.id}`,
          });

          // Update order with paymentId
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentId: approvedPayment.id },
          });

          results.synced++;
          console.log(`✅ Order #${order.id} synced to PAID`);
        } else {
          console.log(`Order #${order.id}: No approved payment found`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        results.failed++;
        results.errors.push(`Order #${order.id}: ${errorMsg}`);
        console.error(`❌ Order #${order.id} sync failed:`, errorMsg);
      }
    }

    console.log("Sync complete:", results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Sync endpoint error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
