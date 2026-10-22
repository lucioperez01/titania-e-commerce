import {
  CreatePromotionInput,
  PromotionDTO,
  toPromotionDTO,
} from "@/Interfaces/dto/promotion.dto"
import { PrismaPromotionRepository } from "@/infrastructure/repositories/PrismaPromotionRepository"

export async function createPromotion(
  input: CreatePromotionInput
): Promise<PromotionDTO> {
  const repo = new PrismaPromotionRepository()

  // 1. Normalize coupon code (uppercase + trim)
  const couponCode = input.couponCode?.trim().toUpperCase() ?? null

  // 2. Validate code uniqueness (case-insensitive)
  if (couponCode) {
    const exists = await repo.existsByCode(couponCode)
    if (exists) {
      throw new Error("Code already exists")
    }
  }

  // 3. Validate endsAt > startsAt
  if (input.startsAt && input.endsAt) {
    if (new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new Error("End date must be after start date")
    }
  }

  // 4. Validate at least one benefit
  if (!input.benefits || input.benefits.length === 0) {
    throw new Error("At least one discount benefit is required")
  }

  // 5. Create atomically
  const created = await repo.create({
    name: input.name,
    type: input.type,
    couponCode,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    conditions: input.conditions,
    benefits: input.benefits,
  })

  // 6. Return DTO
  return toPromotionDTO(created)
}
