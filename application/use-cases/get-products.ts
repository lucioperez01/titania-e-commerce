import { ProductDTO, productToDTO } from "@/Interfaces/dto/product.dto"
import { ProductRepository } from "@/domain/product/repositories/product/product-repository"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import { ProductRepositoryMock } from "@/infrastructure/repositories/product-repository-mock"

export async function getProducts(): Promise<ProductDTO[]> {

    const repo = new PrismaProductRepository()

    const products = await repo.findAll()

    return products.map(productToDTO)

}