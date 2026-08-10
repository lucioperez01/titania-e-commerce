import { Category } from "@/domain/product/entities/category"
import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"

export type UpdateCategoryInput = {
    id: number
} & Partial<{
    name: string
    image: string
}>

export async function updateCategory(input: UpdateCategoryInput): Promise<void> {
    const repo = new PrismaCategoriesRepository()
    const existing = await repo.findById(input.id)

    if (!existing) {
        throw new Error("Categoría no encontrada.")
    }

    const category = new Category({
        id: existing.id,
        name: input.name ?? existing.name,
        image: input.image ?? existing.image,
    })

    await repo.updateCategory(category)
}
