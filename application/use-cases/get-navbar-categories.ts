import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository";
import { CategoryDTO, categoryToDTO } from "@/Interfaces/dto/product.dto";

export async function getNavbarCategories(limit: number = 5): Promise<CategoryDTO[]> {
    const repo = new PrismaCategoriesRepository();
    return repo.findNavbarCategories(limit);
}
