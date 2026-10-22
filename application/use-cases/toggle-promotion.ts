import {
  PromotionDTO,
  toPromotionDTO,
} from "@/Interfaces/dto/promotion.dto"
import { PrismaPromotionRepository } from "@/infrastructure/repositories/PrismaPromotionRepository"

export async function togglePromotion(id: number): Promise<PromotionDTO> {
  const repo = new PrismaPromotionRepository()

  const existing = await repo.findById(id)
  if (!existing) {
    throw new Error("Promotion not found")
  }

  const updated = await repo.toggleActive(id)
  return toPromotionDTO(updated)
}
