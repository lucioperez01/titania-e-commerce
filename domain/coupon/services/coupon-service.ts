import { prisma } from "@/infrastructure/db/prismaClient";
import { Decimal } from "@prisma/client/runtime/library";

export interface CouponValidationResult {
  valid: boolean;
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
}

export interface CartItemForCoupon {
  productId: number;
  variantId?: number | null;
  quantity: number;
  price: number;
}

export class CouponService {
  /**
   * Valida un código de cupón y retorna información del descuento si es válido
   */
  async validateCoupon(
    couponCode: string,
    cartItems: CartItemForCoupon[]
  ): Promise<CouponValidationResult> {
    // Buscar la promoción por código
    const promotion = await prisma.promotion.findFirst({
      where: {
        couponCode: couponCode.toUpperCase(),
        active: true,
        isDeleted: false,
      },
      include: {
        conditions: {
          where: { isDeleted: false },
        },
        benefits: {
          where: { isDeleted: false },
        },
      },
    });

    if (!promotion) {
      return { valid: false, error: "Cupón no encontrado" };
    }

    // Verificar fechas de validez
    const now = new Date();
    if (promotion.startsAt && now < promotion.startsAt) {
      return { valid: false, error: "El cupón aún no está activo" };
    }
    if (promotion.endsAt && now > promotion.endsAt) {
      return { valid: false, error: "El cupón ha expirado" };
    }

    // Verificar condiciones
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    for (const condition of promotion.conditions) {
      // Verificar mínimo de cantidad
      if (condition.minQuantity) {
        const totalQuantity = cartItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        if (totalQuantity < condition.minQuantity) {
          return {
            valid: false,
            error: `Se requieren al menos ${condition.minQuantity} productos`,
          };
        }
      }

      // Verificar mínimo de subtotal
      if (condition.minSubtotal) {
        if (subtotal < Number(condition.minSubtotal)) {
          return {
            valid: false,
            error: `Se requiere un mínimo de $${condition.minSubtotal} en el carrito`,
          };
        }
      }

      // Verificar si aplica a productos específicos
      if (condition.productId || condition.variantId) {
        const hasMatchingProduct = cartItems.some(
          (item) =>
            (condition.productId && item.productId === condition.productId) ||
            (condition.variantId && item.variantId === condition.variantId)
        );
        if (!hasMatchingProduct) {
          return {
            valid: false,
            error: "El cupón no aplica a los productos de tu carrito",
          };
        }
      }
    }

    // Si todo está bien, retornar la promoción
    return {
      valid: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        type: promotion.type,
        couponCode: promotion.couponCode!,
        benefits: promotion.benefits.map((b) => ({
          discountType: b.discountType,
          value: Number(b.value),
          applyToProductId: b.applyToProductId,
          applyToVariantId: b.applyToVariantId,
        })),
      },
    };
  }

  /**
   * Calcula el descuento aplicado a los items del carrito
   */
  calculateDiscount(
    cartItems: CartItemForCoupon[],
    promotion: CouponValidationResult["promotion"]
  ): {
    discountAmount: number;
    discountedItems: Array<{
      productId: number;
      variantId?: number | null;
      originalPrice: number;
      discountedPrice: number;
      discount: number;
    }>;
  } {
    if (!promotion) {
      return { discountAmount: 0, discountedItems: [] };
    }

    const discountedItems: Array<{
      productId: number;
      variantId?: number | null;
      originalPrice: number;
      discountedPrice: number;
      discount: number;
    }> = [];

    let totalDiscount = 0;

    for (const item of cartItems) {
      // Buscar beneficios que apliquen a este item
      const applicableBenefits = promotion.benefits.filter(
        (benefit) =>
          // Si no especifica producto/variante, aplica a todos
          (!benefit.applyToProductId && !benefit.applyToVariantId) ||
          // Si especifica producto, verificar que coincida
          (benefit.applyToProductId &&
            item.productId === benefit.applyToProductId) ||
          // Si especifica variante, verificar que coincida
          (benefit.applyToVariantId && item.variantId === benefit.applyToVariantId)
      );

      if (applicableBenefits.length === 0) {
        // No hay descuento para este item
        discountedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          originalPrice: item.price,
          discountedPrice: item.price,
          discount: 0,
        });
        continue;
      }

      // Aplicar el mejor beneficio (el que da más descuento)
      let bestDiscount = 0;

      for (const benefit of applicableBenefits) {
        let discount = 0;

        if (benefit.discountType === "PERCENTAGE") {
          discount = (item.price * benefit.value) / 100;
        } else if (benefit.discountType === "FIXED") {
          discount = Math.min(benefit.value, item.price);
        } else if (benefit.discountType === "BUY_X_GET_Y") {
          // TODO: Implementar lógica BUY_X_GET_Y
          // Por ahora, tratarlo como descuento fijo
          discount = benefit.value;
        }

        bestDiscount = Math.max(bestDiscount, discount);
      }

      const discountedPrice = Math.max(0, item.price - bestDiscount);
      const itemTotalDiscount = bestDiscount * item.quantity;
      totalDiscount += itemTotalDiscount;

      discountedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        originalPrice: item.price,
        discountedPrice,
        discount: bestDiscount,
      });
    }

    return {
      discountAmount: totalDiscount,
      discountedItems,
    };
  }
}
