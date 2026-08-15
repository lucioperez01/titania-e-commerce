import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { prisma } from "@/infrastructure/db/prismaClient"

export async function searchProducts(query: string, limit = 20): Promise<ProductDTO[]> {
    if (!query || query.trim().length < 2) return []

    const rawProducts = await prisma.product.findMany({
        where: {
            isDeleted: false,
            isOnline: true,
            name: { contains: query.trim(), mode: "insensitive" },
        },
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
    }))
}
