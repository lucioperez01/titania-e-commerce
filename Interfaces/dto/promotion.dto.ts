import { Prisma } from "@prisma/client"

// ── Status ──────────────────────────────────────────────────────────────────

export type PromotionStatus = "ACTIVE" | "EXPIRED" | "SCHEDULED" | "INACTIVE"

// ── DTOs ────────────────────────────────────────────────────────────────────

export type PromotionDTO = {
  id: number
  name: string
  type: "COUPON" | "AUTOMATIC"
  couponCode: string | null
  startsAt: string | null
  endsAt: string | null
  active: boolean
  status: PromotionStatus
  conditions: PromotionConditionDTO[]
  benefits: PromotionBenefitDTO[]
  createdAt: string
}

export type PromotionConditionDTO = {
  id?: number
  minQuantity: number | null
  minSubtotal: number | null
  productId: number | null
  variantId: number | null
}

export type PromotionBenefitDTO = {
  id?: number
  discountType: "PERCENTAGE" | "FIXED" | "BUY_X_GET_Y"
  value: number
  applyToProductId: number | null
  applyToVariantId: number | null
}

// ── Filters ─────────────────────────────────────────────────────────────────

export type PromotionFilter = {
  status?: PromotionStatus | "ALL"
  type?: "COUPON" | "AUTOMATIC"
  search?: string
  page?: number
  limit?: number
}

// ── Use-case input ──────────────────────────────────────────────────────────

export type CreatePromotionInput = {
  name: string
  type: "COUPON" | "AUTOMATIC"
  couponCode?: string
  startsAt?: string | null
  endsAt?: string | null
  conditions: Array<{
    minQuantity?: number
    minSubtotal?: number
    productId?: number
    variantId?: number
  }>
  benefits: Array<{
    discountType: "PERCENTAGE" | "FIXED"
    value: number
    applyToProductId?: number
    applyToVariantId?: number
  }>
}

// ── Prisma payload helper ───────────────────────────────────────────────────

type PromotionWithRelations = Prisma.PromotionGetPayload<{
  include: { conditions: true; benefits: true }
}>

// ── Status computation ──────────────────────────────────────────────────────

export function computeStatus(
  active: boolean,
  startsAt: Date | null,
  endsAt: Date | null
): PromotionStatus {
  if (!active) return "INACTIVE"

  const now = new Date()

  if (endsAt && now > endsAt) return "EXPIRED"
  if (startsAt && now < startsAt) return "SCHEDULED"

  return "ACTIVE"
}

// ── Mappers ─────────────────────────────────────────────────────────────────

export function toPromotionConditionDTO(
  condition: PromotionWithRelations["conditions"][number]
): PromotionConditionDTO {
  return {
    id: condition.id,
    minQuantity: condition.minQuantity,
    minSubtotal:
      condition.minSubtotal !== null
        ? Number(condition.minSubtotal)
        : null,
    productId: condition.productId,
    variantId: condition.variantId,
  }
}

export function toPromotionBenefitDTO(
  benefit: PromotionWithRelations["benefits"][number]
): PromotionBenefitDTO {
  return {
    id: benefit.id,
    discountType: benefit.discountType,
    value: Number(benefit.value),
    applyToProductId: benefit.applyToProductId,
    applyToVariantId: benefit.applyToVariantId,
  }
}

export function toPromotionDTO(
  promotion: PromotionWithRelations
): PromotionDTO {
  return {
    id: promotion.id,
    name: promotion.name,
    type: promotion.type,
    couponCode: promotion.couponCode,
    startsAt: promotion.startsAt?.toISOString() ?? null,
    endsAt: promotion.endsAt?.toISOString() ?? null,
    active: promotion.active,
    status: computeStatus(promotion.active, promotion.startsAt, promotion.endsAt),
    conditions: promotion.conditions
      .filter((c) => !c.isDeleted)
      .map(toPromotionConditionDTO),
    benefits: promotion.benefits
      .filter((b) => !b.isDeleted)
      .map(toPromotionBenefitDTO),
    createdAt: promotion.createdAt.toISOString(),
  }
}
