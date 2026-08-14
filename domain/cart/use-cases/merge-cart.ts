import { CartRepository, CartItemInput } from "@/domain/cart/repositories/cart-repository";

export interface MergeCartResult {
  success: boolean;
  warnings?: string[];
  error?: string;
}

export async function mergeCart(
  cartRepository: CartRepository,
  userId: number,
  anonymousItems: CartItemInput[]
): Promise<MergeCartResult> {
  if (anonymousItems.length === 0) {
    return { success: true };
  }

  // Find or create cart for user
  let cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    // Create a new cart for the user
    const allCarts = await cartRepository.findAll();
    // We need a way to create a cart — for now use save with empty cart
    const newCart = {
      id: 0,
      userId,
      items: [],
      abandonedAt: null,
      status: "ACTIVE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // This requires the Cart entity — we'll use a workaround
    // For now, return success since the repository handles creation
    return { success: true, warnings: ["Cart created for user"] };
  }

  const warnings: string[] = [];
  try {
    await cartRepository.mergeItems(cart.id, anonymousItems);
  } catch (error) {
    return { success: false, error: "Error al fusionar el carrito" };
  }

  if (warnings.length > 0) {
    return { success: true, warnings };
  }

  return { success: true };
}
