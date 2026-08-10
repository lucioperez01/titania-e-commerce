import { Product } from "@/domain/product/entities/product"
import { ProductImage } from "@/domain/product/entities/image"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"

export type UpdateProductInput = {
    id: number
} & Partial<{
    name: string
    price: number
    stock: number
    categoryId: number
    brand: string
    description: string
    images: string[]
}>

export async function updateProduct(input: UpdateProductInput): Promise<void> {
    const repo = new PrismaProductRepository()
    const existing = await repo.findById(input.id)

    if (!existing) {
        throw new Error("Producto no encontrado.")
    }

    const images = input.images !== undefined
        ? input.images.map(url => new ProductImage(0, url, 0))
        : existing.images

    const product = new Product({
        id: existing.id,
        name: input.name ?? existing.name,
        slug: undefined,
        price: input.price ?? existing.price,
        costPrice: existing.costPrice,
        stock: input.stock ?? existing.stock,
        weight: existing.weight,
        images,
        category: existing.category,
        desc: input.description ?? existing.desc,
        brand: input.brand ?? existing.brand,
        rating: existing.rating,
        sold: existing.sold,
        oldPrice: existing.oldPrice,
    })

    await repo.updateProduct(product)
}
