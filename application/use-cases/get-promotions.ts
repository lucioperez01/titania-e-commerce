import {
  PromotionFilter,
  PromotionDTO,
  toPromotionDTO,
} from "@/Interfaces/dto/promotion.dto"
import { PrismaPromotionRepository } from "@/infrastructure/repositories/PrismaPromotionRepository"

export async function getPromotions(
  filter?: PromotionFilter
): Promise<{ data: PromotionDTO[]; total: number; page: number }> {
  const repo = new PrismaPromotionRepository()
  const page = filter?.page ?? 1

  const [items, total] = await Promise.all([
    repo.findAll(filter),
    repo.count(filter),
  ])

  return {
    data: items.map(toPromotionDTO),
    total,
    page,
  }
}
