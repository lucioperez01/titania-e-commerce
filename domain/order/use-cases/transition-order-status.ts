import { prisma } from "@/infrastructure/db/prismaClient";
import { Prisma, OrderStatus as PrismaOrderStatus } from "@prisma/client";

export type TransitionTrigger = "webhook" | "admin" | "cron" | "checkout";

export interface TransitionOrderInput {
  orderId: number;
  newStatus: string;
  trigger: TransitionTrigger;
  trackingNumber?: string;
  paymentId?: string;
  reason?: string;
}

export interface TransitionOrderResult {
  orderId: number;
  previousStatus: string;
  newStatus: string;
  trigger: TransitionTrigger;
  transitionedAt: Date;
}

// Define valid transitions from the state machine
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["RESERVED"],
  RESERVED: ["PAID", "CANCELLED", "EXPIRED"],
  PAID: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  EXPIRED: [],
  RETURNED: [],
  REFUNDED: [],
};

export class TransitionOrderStatus {
  async execute(input: TransitionOrderInput): Promise<TransitionOrderResult> {
    return prisma.$transaction(async (tx) => {
      const [lockedOrder] = await tx.$queryRaw<Array<{ id: number; status: string }>>`
        SELECT id, status FROM "Order" WHERE id = ${input.orderId} FOR UPDATE
      `;

      if (!lockedOrder) {
        throw new Error(`Order #${input.orderId} not found`);
      }

      const currentStatus = lockedOrder.status;
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];

      if (!allowedTransitions.includes(input.newStatus)) {
        throw new Error(
          `Invalid transition: ${currentStatus} → ${input.newStatus}. Allowed: ${allowedTransitions.join(", ") || "none"}`
        );
      }

      const orderWithItems = await tx.order.findUnique({
        where: { id: input.orderId },
        include: { items: true },
      });

      if (!orderWithItems) {
        throw new Error(`Order #${input.orderId} not found`);
      }

      if (input.newStatus === "PAID" && currentStatus === "RESERVED") {
        await this.commitStock(tx, orderWithItems.items);
      } else if (
        (input.newStatus === "CANCELLED" || input.newStatus === "EXPIRED") &&
        currentStatus === "RESERVED"
      ) {
        await this.releaseStock(tx, orderWithItems.items);
      } else if (input.newStatus === "CANCELLED" && currentStatus === "PAID") {
        await this.refundStock(tx, orderWithItems.items);
      }

      const updateData: Record<string, unknown> = {
        status: input.newStatus,
      };

      if (input.newStatus === "PAID") {
        updateData.paidAt = new Date();
      }

      if (input.trackingNumber) {
        updateData.shippingId = input.trackingNumber;
      }

      if (input.paymentId) {
        updateData.paymentId = input.paymentId;
      }

      await tx.order.update({
        where: { id: input.orderId },
        data: updateData,
      });

      await tx.orderStatusTransition.create({
        data: {
          orderId: input.orderId,
          previousStatus: currentStatus as PrismaOrderStatus,
          newStatus: input.newStatus as PrismaOrderStatus,
          trigger: input.trigger,
          reason: input.reason ?? "",
        },
      });

      return {
        orderId: input.orderId,
        previousStatus: currentStatus,
        newStatus: input.newStatus,
        trigger: input.trigger,
        transitionedAt: new Date(),
      };
    });
  }

  private async commitStock(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: number; variantId: number | null; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });
      }
    }
  }

  private async releaseStock(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: number; variantId: number | null; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedStock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedStock: { decrement: item.quantity } },
        });
      }
    }
  }

  private async refundStock(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: number; variantId: number | null; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  }
}
