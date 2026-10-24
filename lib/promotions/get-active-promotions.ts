import { prisma } from "@/infrastructure/db/prismaClient";
import { Decimal } from "@prisma/client/runtime/library";
import { unstable_cache } from "next/cache";

/**
 * Formatted promotion ready to be displayed in the storefront banner.
 */
export type FormattedPromotion = {
  id: number;
  name: string;
  message: string;
};

/**
 * Fetches all active AUTOMATIC promotions valid at the current date
 * and formats them as human-readable banner messages.
 *
 * Filtering rules:
 * - type === "AUTOMATIC" (coupon promotions are not shown here)
 * - active === true && isDeleted === false
 * - Date range: startsAt <= now <= endsAt (null bounds are treated as unbounded)
 *
 * Message format example:
 *   "VERANO 20% OFF en compras +$30.000 | Válido hasta 31/12"
 *   "NAVIDAD 15% OFF | Válido hasta 25/12"  (no condition)
 *   "CYBER $5.000 OFF llevando 3 unidades | Válido hasta 15/11"
 */
async function getActivePromotionsUncached(): Promise<FormattedPromotion[]> {
  const now = new Date();

  const promotions = await prisma.promotion.findMany({
    where: {
      type: "AUTOMATIC",
      active: true,
      isDeleted: false,
      AND: [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
      ],
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

  return promotions
    .map((promotion) => {
      const message = formatPromotionMessage(
        promotion.name,
        promotion.benefits,
        promotion.conditions,
        promotion.endsAt
      );

      if (!message) return null;

      return {
        id: promotion.id,
        name: promotion.name,
        message,
      };
    })
    .filter((p): p is FormattedPromotion => p !== null);
}

/**
 * Cached version of getActivePromotions.
 * Revalidates every 60 seconds to balance freshness and performance.
 */
export const getActivePromotions = unstable_cache(
  getActivePromotionsUncached,
  ["active-promotions"],
  { revalidate: 60 }
);

/**
 * Builds the human-readable message for a single promotion.
 * Returns null if the promotion has no valid benefit to display.
 */
function formatPromotionMessage(
  name: string,
  benefits: Array<{ discountType: string; value: Decimal }>,
  conditions: Array<{ minSubtotal: Decimal | null; minQuantity: number | null }>,
  endsAt: Date | null,
): string | null {
  if (benefits.length === 0) return null;

  // Use the first benefit as the primary message (automatic promotions
  // typically have a single benefit; multiple benefits would require
  // a more elaborate UI that is out of scope for the banner).
  const benefit = benefits[0];
  const benefitText = formatBenefit(benefit.discountType, benefit.value);
  if (!benefitText) return null;

  const conditionText = formatCondition(conditions[0]);
  const validityText = formatValidity(endsAt);

  const parts = [name.trim(), benefitText];
  if (conditionText) parts.push(conditionText);
  if (validityText) parts.push(validityText);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Formats the benefit portion of the message.
 * - PERCENTAGE → "20% OFF"
 * - FIXED      → "$5.000 OFF"
 * - BUY_X_GET_Y → fallback to value as-is (rare case)
 */
function formatBenefit(discountType: string, value: Decimal): string | null {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || numericValue <= 0) return null;

  switch (discountType) {
    case "PERCENTAGE":
      // Drop decimals for clean display (20.00 → 20)
      const pct = Number.isInteger(numericValue)
        ? numericValue.toString()
        : numericValue.toString();
      return `${pct}% OFF`;
    case "FIXED":
      return `$${numericValue.toLocaleString("es-AR")} OFF`;
    case "BUY_X_GET_Y":
      return `${numericValue}% OFF`;
    default:
      return null;
  }
}

/**
 * Formats the condition portion of the message.
 * - minSubtotal present → "en compras +$30.000"
 * - minQuantity present → "llevando 3 unidades"
 * - both null         → "" (no condition to display)
 */
function formatCondition(
  condition: { minSubtotal: Decimal | null; minQuantity: number | null } | undefined,
): string {
  if (!condition) return "";

  if (condition.minSubtotal != null) {
    const subtotal = Number(condition.minSubtotal);
    if (!Number.isNaN(subtotal) && subtotal > 0) {
      return `en compras +$${subtotal.toLocaleString("es-AR")}`;
    }
  }

  if (condition.minQuantity != null && condition.minQuantity > 0) {
    return `llevando ${condition.minQuantity} unidades`;
  }

  return "";
}

/**
 * Formats the validity portion of the message.
 * - endsAt present → "válido hasta 31/12"
 * - null          → "" (no end date to display)
 */
function formatValidity(endsAt: Date | null): string {
  if (!endsAt) return "";

  const day = endsAt.getDate().toString().padStart(2, "0");
  const month = (endsAt.getMonth() + 1).toString().padStart(2, "0");
  
  return `válido hasta ${day}/${month}`;
}
