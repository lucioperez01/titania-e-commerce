import type { PromotionFilter } from "@/Interfaces/dto/promotion.dto"

// ── Query options ───────────────────────────────────────────────────────────

export type FindAllOptions = {
  status?: PromotionFilter["status"]
  type?: PromotionFilter["type"]
  search?: string
  page?: number
  limit?: number
}

// ── Create / update input ───────────────────────────────────────────────────

export type PromotionConditionData = {
  minQuantity?: number | null
  minSubtotal?: number | null
  productId?: number | null
  variantId?: number | null
}

export type PromotionBenefitData = {
  discountType: "PERCENTAGE" | "FIXED" | "BUY_X_GET_Y"
  value: number
  applyToProductId?: number | null
  applyToVariantId?: number | null
}

export type CreatePromotionData = {
  name: string
  type: "COUPON" | "AUTOMATIC"
  couponCode?: string | null
  startsAt?: Date | null
  endsAt?: Date | null
  active?: boolean
  conditions: PromotionConditionData[]
  benefits: PromotionBenefitData[]
}

export type UpdatePromotionData = {
  name?: string
  type?: "COUPON" | "AUTOMATIC"
  couponCode?: string | null
  startsAt?: Date | null
  endsAt?: Date | null
  active?: boolean
  conditions?: PromotionConditionData[]
  benefits?: PromotionBenefitData[]
}

// ── Repository interface ────────────────────────────────────────────────────

export interface PromotionRepository {
  findAll(options?: FindAllOptions): Promise<unknown[]>
  count(options?: FindAllOptions): Promise<number>
  findById(id: number): Promise<unknown | null>
  create(data: CreatePromotionData): Promise<unknown>
  update(id: number, data: UpdatePromotionData): Promise<unknown>
  softDelete(id: number): Promise<void>
  toggleActive(id: number): Promise<unknown>
  existsByCode(code: string, excludeId?: number): Promise<boolean>
}
