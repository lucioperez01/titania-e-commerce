import { CartRepository } from "@/domain/cart/repositories/cart-repository";
import { Cart } from "@/domain/cart/entities/cart";
import { CartItem } from "@/domain/cart/entities/cartItem";
import { CartStatus } from "@/domain/cart/entities/cartStatus";

export interface CartDTO {
  id: number;
  userId: number | null;
  items: Array<{ productId: number; quantity: number; variantId: number | null }>;
  status: string;
}

export async function getCart(
  cartRepository: CartRepository,
  userId: number
): Promise<CartDTO> {
  const cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    return { id: 0, userId, items: [], status: "ACTIVE" };
  }

  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      variantId: item.variantId ?? null,
    })),
    status: String(cart.status),
  };
}
