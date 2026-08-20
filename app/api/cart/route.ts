import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PrismaCartRepository } from "@/infrastructure/repositories/PrismaCartRepository"
import { Cart } from "@/domain/cart/entities/cart"
import { CartItem } from "@/domain/cart/entities/cartItem"
import { CartStatus } from "@/domain/cart/entities/cartStatus"

const cartRepository = new PrismaCartRepository()

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ items: [], count: 0 })
    }

    const userId = Number(session.user.id)

    try {
        const cart = await cartRepository.findByUserId(userId)
        if (!cart) {
            return NextResponse.json({ items: [], count: 0 })
        }

        return NextResponse.json({
            items: cart.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                variantId: item.variantId ?? null,
            })),
            count: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        })
    } catch (error) {
        console.error("Cart GET error:", error)
        return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const body = await request.json()
    const { action, items } = body

    try {
        let cart = await cartRepository.findByUserId(userId)

        if (!cart) {
            const newCart = new Cart(0, userId, [], null, CartStatus.ACTIVE, new Date(), new Date())
            await cartRepository.save(newCart)
            cart = await cartRepository.findByUserId(userId)
            if (!cart) {
                return NextResponse.json({ error: "Failed to create cart" }, { status: 500 })
            }
        }

        if (action === "MERGE" && Array.isArray(items)) {
            await cartRepository.mergeItems(cart.id, items)
        } else if (action === "SYNC" && Array.isArray(items)) {
            const cartItems = items.map(
                (item: { productId: number; quantity: number; variantId?: number | null }, idx: number) =>
                    new CartItem(-(idx + 1), cart!.id, item.productId, item.quantity, item.variantId ?? null)
            )
            const updatedCart = new Cart(cart.id, userId, cartItems, null, CartStatus.ACTIVE, new Date(), new Date())
            await cartRepository.save(updatedCart)
        } else if (action === "CLEAR") {
            const emptyCart = new Cart(cart.id, userId, [], null, CartStatus.ACTIVE, new Date(), new Date())
            await cartRepository.save(emptyCart)
        }

        const refreshed = await cartRepository.findByUserId(userId)
        const finalItems = refreshed?.items ?? []

        return NextResponse.json({
            items: finalItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                variantId: item.variantId ?? null,
            })),
            count: finalItems.reduce((sum, item) => sum + item.quantity, 0),
        })
    } catch (error) {
        console.error("Cart POST error:", error)
        return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
    }
}

export async function DELETE() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)

    try {
        const cart = await cartRepository.findByUserId(userId)

        if (cart) {
            const emptyCart = new Cart(cart.id, userId, [], null, CartStatus.ACTIVE, new Date(), new Date())
            await cartRepository.save(emptyCart)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Cart DELETE error:", error)
        return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 })
    }
}
