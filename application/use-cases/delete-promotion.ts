import { PrismaPromotionRepository } from "@/infrastructure/repositories/PrismaPromotionRepository"

export async function deletePromotion(id: number): Promise<void> {
  const repo = new PrismaPromotionRepository()

  const existing = await repo.findById(id)
  if (!existing) {
    throw new Error("Promotion not found")
  }

  await repo.softDelete(id)
}
