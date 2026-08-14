import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository";
import { CategoryDTO } from "@/Interfaces/dto/product.dto";


export async function getCategories(): Promise<CategoryDTO[]> {
    const repo = new PrismaCategoriesRepository();
    return repo.findAll();
}

export async function getActiveCategories(): Promise<CategoryDTO[] | null> {
    const repo = new PrismaCategoriesRepository();
    const categories = await repo.findAllActive();
    return categories;
}