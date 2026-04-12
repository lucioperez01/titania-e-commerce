import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository";
import { CategoryDTO, categoryToDTO } from "@/Interfaces/dto/product.dto";

export async function getCategories(): Promise<CategoryDTO[]> {
    const repo = new PrismaCategoriesRepository();
    const categories = await repo.findAll();
    return categories.map(categoryToDTO)
}