import {
  PromotionDTO,
  toPromotionDTO,
} from "@/Interfaces/dto/promotion.dto"
import {
  UpdatePromotionData,
} from "@/domain/promotion/repositories/promotion-repository"
import { PrismaPromotionRepository } from "@/infrastructure/repositories/PrismaPromotionRepository"

export type UpdatePromotionInput = {
  id: number
  name?: string
  type?: "COUPON" | "AUTOMATIC"
  couponCode?: string | null
  startsAt?: string | null
  endsAt?: string | null
  conditions?: Array<{
    minQuantity?: number
    minSubtotal?: number
    productId?: number
    variantId?: number
  }>
  benefits?: Array<{
    discountType: "PERCENTAGE" | "FIXED"
    value: number
    applyToProductId?: number
    applyToVariantId?: number
  }>
}

export async function updatePromotion(
  input: UpdatePromotionInput
): Promise<PromotionDTO> {
  const repo = new PrismaPromotionRepository()

  // 1. Validate promotion exists
  const existing = await repo.findById(input.id)
  if (!existing) {
    throw new Error("Promotion not found")
  }

  // existing is PromotionWithRelations (narrowed from concrete repo)
  const existingWithRelations = existing as Awaited<
    ReturnType<PrismaPromotionRepository["findById"]>
  > &
    object

  // 2. Validate code uniqueness excluding self
  if (input.couponCode !== undefined && input.couponCode !== null) {
    const normalizedCode = input.couponCode.trim().toUpperCase()
    const exists = await repo.existsByCode(normalizedCode, input.id)
    if (exists) {
      throw new Error("Code already exists")
    }
  }

  // 3. Validate date range
  if (input.startsAt && input.endsAt) {
    if (new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new Error("End date must be after start date")
    }
  }

  // 4. Validate at least one benefit (use provided or existing)
  const existingBenefits =
    existingWithRelations.benefits?.filter((b) => !b.isDeleted) ?? []
  const effectiveBenefits = input.benefits ?? existingBenefits
  if (effectiveBenefits.length === 0) {
    throw new Error("At least one discount benefit is required")
  }

  // 5. Build update data
  const updateData: UpdatePromotionData = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.type !== undefined) updateData.type = input.type
  if (input.couponCode !== undefined && input.couponCode !== null) {
    updateData.couponCode = input.couponCode.trim().toUpperCase()
  }
  if (input.couponCode === null) {
    updateData.couponCode = null
  }
  if (input.startsAt !== undefined)
    updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null
  if (input.endsAt !== undefined)
    updateData.endsAt = input.endsAt ? new Date(input.endsAt) : null
  if (input.conditions !== undefined) updateData.conditions = input.conditions
  if (input.benefits !== undefined) updateData.benefits = input.benefits

  // 6. Update atomically
  const updated = await repo.update(input.id, updateData)

  return toPromotionDTO(updated)
}
