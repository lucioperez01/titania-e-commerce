import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prismaClient";
import { TransitionOrderStatus } from "@/domain/order/use-cases/transition-order-status";

function validateAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not configured");
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === secret;
}

export async function GET(request: Request) {
  if (!validateAuth(request)) {
    console.warn("Unauthorized cron request to release-reservations");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const timeoutHours = Number(process.env.RESERVATION_TIMEOUT_HOURS ?? 24);
    const cutoff = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "RESERVED",
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({ expired: 0, failed: 0, errors: [] });
    }

    const transitionUseCase = new TransitionOrderStatus();
    let expired = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const order of expiredOrders) {
      try {
        await transitionUseCase.execute({
          orderId: order.id,
          newStatus: "EXPIRED",
          trigger: "cron",
          reason: `Reservation expired after ${timeoutHours}h`,
        });
        expired++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Order #${order.id}: ${msg}`);
        console.error(`Failed to expire order #${order.id}:`, msg);
      }
    }

    console.log(`Cron release-reservations: ${expired} expired, ${failed} failed`);

    return NextResponse.json({ expired, failed, errors });
  } catch (error) {
    console.error("release-reservations cron error:", error);
    return NextResponse.json(
      { error: "Internal error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
