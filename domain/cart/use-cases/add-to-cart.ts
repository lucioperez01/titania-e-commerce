import { CartRepository } from "@/domain/cart/repositories/cart-repository";

export interface AddToCartResult {
  success: boolean;
  error?: string;
}

export async function addToCart(
  cartRepository: CartRepository,
  cartId: number,
  productId: number,
  quantity: number,
  variantId: number | null
): Promise<AddToCartResult> {
  try {
    await cartRepository.addItem(cartId, productId, quantity, variantId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Insufficient stock") {
      return { success: false, error: "Stock insuficiente" };
    }
    if (error instanceof Error && error.message === "Cart not found") {
      return { success: false, error: "Carrito no encontrado" };
    }
    return { success: false, error: "Error al agregar al carrito" };
  }
}
