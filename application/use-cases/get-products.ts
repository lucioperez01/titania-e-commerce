import { ProductDTO, productToDTO } from "@/Interfaces/dto/product.dto"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"

export async function getProducts(): Promise<ProductDTO[]> {
    const repo = new PrismaProductRepository()
    const products = await repo.findAll()
    return products.map(productToDTO)

}