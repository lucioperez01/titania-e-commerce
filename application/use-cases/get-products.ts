import { ProductDTO, productToDTO } from "@/Interfaces/dto/product.dto"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"

export type GetProductsOptions = {
    onlyOnline?: boolean
}

export async function getProducts(options?: GetProductsOptions): Promise<ProductDTO[]> {
    const repo = new PrismaProductRepository()
    const products = options?.onlyOnline
        ? await repo.findAll({ isOnline: true })
        : await repo.findAll()
    return products.map(productToDTO)
}