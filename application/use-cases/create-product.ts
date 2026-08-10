import { Product } from "@/domain/product/entities/product"
import { ProductImage } from "@/domain/product/entities/image"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"

export type CreateProductInput = {
    name: string
    price: number
    stock: number
    categoryId: number
    brand?: string
    description?: string
    images?: string[]
}

export async function createProduct(input: CreateProductInput): Promise<void> {
    if (!input.images || input.images.length === 0) {
        throw new Error("El producto debe tener al menos una imagen.")
    }

    const categoryRepo = new PrismaCategoriesRepository()
    const category = await categoryRepo.findById(input.categoryId)

    if (!category) {
        throw new Error("La categoría no existe.")
    }

    const product = new Product({
        id: 0,
        name: input.name,
        price: input.price,
        costPrice: input.price,
        stock: input.stock,
        weight: 1,
        images: input.images.map(url => new ProductImage(0, url, 0)),
        category,
        desc: input.description ?? input.name,
        brand: input.brand ?? input.name,
    })

    const repo = new PrismaProductRepository()
    await repo.addProduct(product)
}
