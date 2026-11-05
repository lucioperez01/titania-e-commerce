import { ProductDTO, productToDTO, AdminProductDTO, adminProductToDTO } from "@/Interfaces/dto/product.dto"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"

export type GetProductsOptions = {
    onlyOnline?: boolean
    categorySlug?: string
    sizes?: string[]
    orderBy?: 'sold' | 'createdAt'
    take?: number
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
    
    const repoOptions = { categoryId, sizes: options?.sizes, orderBy: options?.orderBy, take: options?.take }
    const products = options?.onlyOnline
        ? await repo.findAll({ isOnline: true, ...repoOptions })
        : await repo.findAll(repoOptions)
    return products.map(productToDTO)
}

export async function getAdminProducts(options?: GetProductsOptions): Promise<AdminProductDTO[]> {
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
        ? await repo.findAll({ isOnline: true, categoryId, sizes: options?.sizes })
        : await repo.findAll({ categoryId, sizes: options?.sizes })
    return products.map(adminProductToDTO)
}