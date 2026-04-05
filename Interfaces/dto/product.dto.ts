import { Product } from "@/domain/product/entities/product"
import { ProductImage } from "@/domain/product/entities/image"
import { Category } from "@/domain/product/entities/category"


export type ProductDTO = {
    id: number
    name: string
    slug: string
    price: number
    oldPrice?: number
    images: ProductImageDTO[]
    rating?: number
    sold?: number
    desc?: string
    category: CategoryDTO
    brand: string
    stock: number
}

export type ProductImageDTO = {
    id: number
    url: string
}

export type ProductResponseDTO = {
    products: ProductDTO[]
    pagination: {
        total: number
        page: number
        limit: number
    }
}

export type CategoryDTO = {
    id: number
    name: string
    slug: string
}

export function categoryToDTO(category: Category): CategoryDTO {
    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
    }
}

export function imagesToDTO(images: ProductImage[]): ProductImageDTO[] {
    return images.map(image => ({
        id: image.id,
        url: image.url
    }))
}

export function productToDTO(product: Product): ProductDTO {
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        oldPrice: product.oldPrice,
        images: imagesToDTO(product.images),
        rating: product.rating,
        sold: product.sold,
        desc: product.desc,
        category: categoryToDTO(product.category),
        brand: product.brand,
        stock: product.stock
    }
}