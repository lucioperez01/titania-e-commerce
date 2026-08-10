import { Category } from "@/domain/product/entities/category"
import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"

export type CreateCategoryInput = {
    name: string
    image?: string
}

export async function createCategory(input: CreateCategoryInput): Promise<void> {
    const repo = new PrismaCategoriesRepository()
    const categories = await repo.findAll()

    const normalizedName = input.name.trim().toLowerCase()

    if (normalizedName.length === 0) {
        throw new Error("El nombre de la categoría es obligatorio.")
    }

    const duplicate = categories.find(
        (category) => category.name.toLowerCase() === normalizedName
    )

    if (duplicate) {
        throw new Error("Ya existe una categoría con ese nombre.")
    }

    const category = new Category({
        id: 0,
        name: input.name.trim(),
        image: input.image,
    })

    await repo.addCategory(category)
}
