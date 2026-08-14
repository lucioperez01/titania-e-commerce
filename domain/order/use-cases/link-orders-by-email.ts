import { OrderRepository } from "@/domain/order/repositories/orderRepository";

export interface LinkOrdersResult {
  success: boolean;
  linkedCount: number;
  error?: string;
}

export async function linkOrdersByEmail(
  orderRepository: OrderRepository,
  email: string,
  userId: number
): Promise<LinkOrdersResult> {
  try {
    // Find all guest orders with this email
    const guestOrders = await orderRepository.findGuestOrdersByEmail(email);

    if (guestOrders.length === 0) {
      return { success: true, linkedCount: 0 };
    }

    // Link them to the user
    const result = await orderRepository.linkOrdersToUser(email, userId);

    return { success: true, linkedCount: result.count };
  } catch (error) {
    return {
      success: false,
      linkedCount: 0,
      error: "Error al vincular órdenes",
    };
  }
}
