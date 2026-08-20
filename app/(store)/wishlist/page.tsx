import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/infrastructure/db/prismaClient"
import { ProductDTO, ProductImageDTO } from "@/Interfaces/dto/product.dto"
import WishlistPageClient from "./wishlist-page-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Mi Wishlist",
}

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

export default async function WishlistPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
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

    return (
        <main className="max-w-6xl mx-auto p-5 w-full">
            <WishlistPageClient items={items} />
        </main>
    )
}
