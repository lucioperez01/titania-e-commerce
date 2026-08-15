import { ProductDTO, productToDTO } from "@/Interfaces/dto/product.dto"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"

export type GetProductsOptions = {
    onlyOnline?: boolean
    categorySlug?: string
}

export async function getProducts(options?: GetProductsOptions): Promise<ProductDTO[]> {
    const repo = new PrismaProductRepository()
    const categoryRepo = new PrismaCategoriesRepository()
    
    let categoryId: number | undefined
    if (options?.categorySlug) {
        const category = await categoryRepo.findBySlug(options.categorySlug)
        if (!category) {
            return []
        }
        categoryId = category.id
    }
    
    const products = options?.onlyOnline
        ? await repo.findAll({ isOnline: true, categoryId })
        : await repo.findAll({ categoryId })
    return products.map(productToDTO)
}