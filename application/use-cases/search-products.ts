import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { prisma } from "@/infrastructure/db/prismaClient"

export async function searchProducts(query: string, limit = 20, sizes?: string[]): Promise<ProductDTO[]> {
    if (!query || query.trim().length < 2) return []

    const where: {
        isDeleted: boolean
        isOnline: boolean
        name: { contains: string; mode: "insensitive" }
        size?: { in: string[] }
    } = {
        isDeleted: false,
        isOnline: true,
        name: { contains: query.trim(), mode: "insensitive" },
    }

    if (sizes && sizes.length > 0) {
        where.size = { in: sizes }
    }

    const rawProducts = await prisma.product.findMany({
        where,
        include: { category: true, images: true },
        take: limit,
        orderBy: { name: "asc" },
    })

    return rawProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        oldPrice: p.oldPrice != null ? Number(p.oldPrice) : undefined,
        images: p.images.map(img => ({ id: img.id, url: img.url })),
        rating: p.rating,
        sold: p.sold ?? undefined,
        desc: p.description ?? undefined,
        category: {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            image: p.category.image ?? undefined,
            description: p.category.description ?? undefined,
            showInNavbar: p.category.showInNavbar,
        },
        brand: p.brand ?? "",
        stock: p.stock,
        isOnline: p.isOnline ?? true,
        size: p.size ?? undefined,
        width: p.width ?? undefined,
        length: p.length ?? undefined,
    }))
}
