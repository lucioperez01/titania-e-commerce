import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"

export async function deleteCategory(id: number): Promise<void> {
    const repo = new PrismaCategoriesRepository()
    await repo.deleteCategory(id)
}
