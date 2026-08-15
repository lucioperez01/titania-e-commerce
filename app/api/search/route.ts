import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/infrastructure/db/prismaClient"
import { ProductDTO, CategoryDTO } from "@/Interfaces/dto/product.dto"

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
        // Sin query: devolver categorías populares (showInNavbar activas)
        const popularCategories = await prisma.category.findMany({
            where: { isDeleted: false, showInNavbar: true },
            take: 6,
            orderBy: { name: "asc" },
        })
        return NextResponse.json({
            products: [],
            categories: popularCategories.map(c => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                image: c.image ?? undefined,
                description: c.description ?? undefined,
                showInNavbar: c.showInNavbar,
                isDeleted: c.isDeleted,
            })),
        })
    }

    const [rawProducts, rawCategories] = await Promise.all([
        prisma.product.findMany({
            where: {
                isDeleted: false,
                isOnline: true,
                name: { contains: q, mode: "insensitive" },
            },
            include: { category: true, images: true },
            take: 5,
            orderBy: { name: "asc" },
        }),
        prisma.category.findMany({
            where: {
                isDeleted: false,
                name: { contains: q, mode: "insensitive" },
            },
            take: 3,
            orderBy: { name: "asc" },
        }),
    ])

    const products: ProductDTO[] = rawProducts.map(p => ({
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

    const categories: CategoryDTO[] = rawCategories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image ?? undefined,
        description: c.description ?? undefined,
        showInNavbar: c.showInNavbar,
        isDeleted: c.isDeleted,
    }))

    return NextResponse.json({ products, categories })
}
