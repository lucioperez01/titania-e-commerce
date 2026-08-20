import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/infrastructure/db/prismaClient"
import { ProductDTO, ProductImageDTO } from "@/Interfaces/dto/product.dto"

function mapToProductDTO(p: {
    id: number
    name: string
    slug: string
    price: unknown
    oldPrice: unknown
    description: string | null
    brand: string | null
    stock: number
    rating: number
    sold: number | null
    isOnline: boolean
    images: Array<{ id: number; url: string }>
    category: { id: number; name: string; slug: string; image: string | null; description: string | null; showInNavbar: boolean }
}): ProductDTO {
    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        oldPrice: p.oldPrice != null ? Number(p.oldPrice) : undefined,
        desc: p.description ?? undefined,
        brand: p.brand ?? "",
        stock: p.stock,
        rating: p.rating,
        sold: p.sold ?? undefined,
        isOnline: p.isOnline ?? true,
        images: p.images.map((img): ProductImageDTO => ({ id: img.id, url: img.url })),
        category: {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            image: p.category.image ?? undefined,
            description: p.category.description ?? undefined,
            showInNavbar: p.category.showInNavbar,
        },
    }
}

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)

    const wishlistItems = await prisma.wishlistItem.findMany({
        where: { userId },
        include: {
            product: {
                include: {
                    images: { where: { isDeleted: false } },
                    category: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    const items = wishlistItems.map(item => ({
        id: item.id,
        product: mapToProductDTO(item.product),
    }))

    return NextResponse.json({ items, count: items.length })
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const body = await request.json()
    const productId = Number(body.productId)

    if (isNaN(productId)) {
        return NextResponse.json({ error: "Invalid productId" }, { status: 400 })
    }

    await prisma.wishlistItem.upsert({
        where: {
            userId_productId: { userId, productId },
        },
        update: {},
        create: { userId, productId },
    })

    return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const productId = Number(request.nextUrl.searchParams.get("productId"))

    if (isNaN(productId)) {
        return NextResponse.json({ error: "Invalid productId" }, { status: 400 })
    }

    await prisma.wishlistItem.deleteMany({
        where: { userId, productId },
    })

    return NextResponse.json({ success: true })
}
