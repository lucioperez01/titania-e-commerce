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
    costPrice: number | null
    size: string | null
    width: number | null
    length: number | null
}>

export async function updateProduct(input: UpdateProductInput): Promise<{ warning?: string }> {
    const repo = new PrismaProductRepository()
    const existing = await repo.findById(input.id)

    if (!existing) {
        throw new Error("Producto no encontrado.")
    }

    const images = input.images !== undefined
        ? input.images.map(url => new ProductImage(0, url, 0))
        : existing.images

    const mergedPrice = input.price ?? existing.price
    const mergedCostPrice = input.costPrice !== undefined ? input.costPrice : existing.costPrice

    const product = new Product({
        id: existing.id,
        name: input.name ?? existing.name,
        slug: undefined,
        price: mergedPrice,
        costPrice: mergedCostPrice,
        stock: input.stock ?? existing.stock,
        weight: existing.weight,
        images,
        category: existing.category,
        desc: input.description ?? existing.desc,
        brand: input.brand ?? existing.brand,
        rating: existing.rating,
        sold: existing.sold,
        oldPrice: existing.oldPrice,
        size: input.size ?? null,
        width: input.width ?? null,
        length: input.length ?? null,
    })

    await repo.updateProduct(product)

    const warning = (mergedCostPrice !== null && mergedCostPrice > mergedPrice)
        ? "El precio de costo supera el precio de venta."
        : undefined

    return { warning }
}
