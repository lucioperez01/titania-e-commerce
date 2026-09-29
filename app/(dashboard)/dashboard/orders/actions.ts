"use server";

import { prisma } from "@/infrastructure/db/prismaClient";
import { revalidatePath } from "next/cache";
import { TransitionOrderStatus } from "@/domain/order/use-cases/transition-order-status";
import { OrderDashboardRepository, OrderFilters } from "@/infrastructure/repositories/OrderDashboardRepository";
import { OrderStatus } from "@prisma/client";
import { sendOrderEmailAsync } from "@/lib/email/send-order-emails";

export type ActionResult = { success: boolean; error?: string };

export async function shipOrderAction(orderId: number, trackingNumber: string): Promise<ActionResult> {
  try {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return { success: false, error: "El número de seguimiento es obligatorio" };
    }

    const useCase = new TransitionOrderStatus();
    await useCase.execute({
      orderId,
      newStatus: "SHIPPED",
      trigger: "admin",
      trackingNumber: trackingNumber.trim(),
      reason: "Marcado como enviado desde el dashboard",
    });

    const repository = new OrderDashboardRepository();
    const order = await repository.findOrderWithDetails(orderId);
    if (order) {
      sendOrderEmailAsync("order.shipped", {
        orderNumber: order.id,
        customerName: order.fullName,
        customerEmail: order.email,
        items: order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        total: Number(order.total),
        trackingNumber: trackingNumber.trim(),
      });
    }

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al marcar el pedido como enviado";
    return { success: false, error: message };
  }
}

export async function cancelOrderAction(orderId: number): Promise<ActionResult> {
  try {
    const useCase = new TransitionOrderStatus();
    await useCase.execute({
      orderId,
      newStatus: "CANCELLED",
      trigger: "admin",
      reason: "Cancelado desde el dashboard",
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cancelar el pedido";
    return { success: false, error: message };
  }
}

export async function getOrdersAction(filters: OrderFilters) {
  const repository = new OrderDashboardRepository();
  return repository.findOrdersWithFilters(filters);
}

export async function getOrderDetailAction(orderId: number) {
  const repository = new OrderDashboardRepository();
  return repository.findOrderWithDetails(orderId);
}

export async function getDashboardMetricsAction() {
  const repository = new OrderDashboardRepository();
  return repository.getDashboardMetrics();
}

export async function getRecentOrdersAction(limit: number = 10) {
  const repository = new OrderDashboardRepository();
  return repository.getRecentOrders(limit);
}

export async function getOrderStatusCountsAction() {
  const statuses: OrderStatus[] = ["PENDING", "RESERVED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "EXPIRED"];

  const counts = await Promise.all(
    statuses.map(async (status) => {
      const count = await prisma.order.count({
        where: { status, isDeleted: false },
      });
      return { status, count };
    })
  );

  return counts;
}
