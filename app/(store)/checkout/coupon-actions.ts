"use server";

import { CouponService } from "@/domain/coupon/services/coupon-service";
import { prisma } from "@/infrastructure/db/prismaClient";
import { auth } from "@/lib/auth";

export interface ValidateCouponResult {
  success: boolean;
  valid?: boolean;
  promotion?: {
    id: number;
    name: string;
    type: string;
    couponCode: string;
    benefits: Array<{
      discountType: string;
      value: number;
      applyToProductId?: number | null;
      applyToVariantId?: number | null;
    }>;
  };
  error?: string;
  discountAmount?: number;
}

/**
 * Valida un código de cupón y calcula el descuento aplicable
 */
export async function validateCouponAction(
  couponCode: string
): Promise<ValidateCouponResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Debes iniciar sesión" };
    }

    const userId = Number(session.user.id);

    // Obtener el carrito del usuario
    const cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        isDeleted: false,
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Tu carrito está vacío" };
    }

    // Convertir items del carrito al formato esperado por el servicio
    const cartItems = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.variantId
        ? Number(item.variant?.price ?? item.product.price)
        : Number(item.product.price),
    }));

    const couponService = new CouponService();
    const validation = await couponService.validateCoupon(
      couponCode.toUpperCase(),
      cartItems
    );

    if (!validation.valid || !validation.promotion) {
      return {
        success: true,
        valid: false,
        error: validation.error || "Cupón inválido",
      };
    }

    // Calcular el descuento
    const discount = couponService.calculateDiscount(
      cartItems,
      validation.promotion
    );

    return {
      success: true,
      valid: true,
      promotion: validation.promotion,
      discountAmount: discount.discountAmount,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      success: false,
      error: "Error al validar el cupón",
    };
  }
}
