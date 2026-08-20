"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { useWishlist } from "@/components/wishlist/wishlist-provider"
import { useCart } from "@/components/cart/cart-provider"
import { useToast } from "@/components/ui/toast"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import Price from "@/components/product/price"

const MOVE_TO_CART_KEY = "titania-move-to-cart"

function useMoveToCart() {
    const [moveToCart, setMoveToCart] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem(MOVE_TO_CART_KEY)
        if (stored !== null) setMoveToCart(stored === "true")
    }, [])

    const handleChange = (value: boolean) => {
        setMoveToCart(value)
        localStorage.setItem(MOVE_TO_CART_KEY, String(value))
    }

    return { moveToCart, setMoveToCart: handleChange }
}

interface WishlistProductCardProps {
    product: ProductDTO
    onRemove: (productId: number) => void
    moveToCart: boolean
}

function WishlistProductCard({ product, onRemove, moveToCart }: WishlistProductCardProps) {
    const { toggle, isInWishlist } = useWishlist()
    const { state, dispatch } = useCart()
    const { showToast } = useToast()
    const inWishlist = isInWishlist(product.id)
    const [addingToCart, setAddingToCart] = useState(false)

    const currentQty = state.items
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0)
    const outOfStock = product.stock <= 0
    const atMaxStock = product.stock > 0 && currentQty >= product.stock

    const handleAddToCart = () => {
        setAddingToCart(true)
        dispatch({ type: "ADD", productId: product.id, quantity: 1, stock: product.stock })

        if (moveToCart) {
            toggle(product.id)
            onRemove(product.id)
            showToast("Movido al carrito")
        } else {
            showToast("Agregado al carrito")
        }

        setTimeout(() => setAddingToCart(false), 400)
    }

    return (
        <div className="relative flex flex-col border border-gray-100/80 shadow-xl">
            <div className="relative">
                <Link href={`/product/${product.slug}`}>
                    <img
                        src={product.images[0]?.url}
                        alt={product.name}
                        className="object-cover object-top w-full h-70"
                    />
                </Link>
            <button
                onClick={() => {
                    if (inWishlist) {
                        toggle(product.id)
                        onRemove(product.id)
                        showToast("Quitado de tu wishlist")
                    }
                }}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 cursor-pointer ${
                    inWishlist
                        ? "text-purple-400"
                        : "text-white/80 hover:text-white hover:bg-purple-900/40"
                }`}
                aria-label={inWishlist ? "Quitar de wishlist" : "Agregar a wishlist"}
            >
                <Heart className={`w-5 h-5 transition-all duration-200 ${inWishlist ? "fill-purple-400 stroke-white scale-110" : ""}`} />
            </button>
            </div>
            <div className="flex flex-col justify-between p-5 text-white">
                <div>
                    <Link href={`/product/${product.slug}`}>
                        <p className="text-xl truncate">{product.name}</p>
                    </Link>
                    <div className="mt-1">
                        <Price value={product.price} oldValue={product.oldPrice} sm={true} />
                    </div>
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={outOfStock || atMaxStock || addingToCart}
                    className="mt-4 w-full flex items-center justify-center gap-2 border border-purple-500/30 bg-purple-900/40 hover:bg-purple-800/60 text-white py-2.5 rounded-md font-secondary text-sm uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {addingToCart ? (
                        <span className="block w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    ) : (
                        <ShoppingCart className="w-4 h-4" />
                    )}
                    Agregar al carrito
                </button>
                {atMaxStock && (
                    <span className="text-red-300 text-xs mt-1 text-center">Sin stock disponible para más unidades</span>
                )}
            </div>
        </div>
    )
}

interface WishlistPageClientProps {
    items: Array<{ id: number; product: ProductDTO }>
}

export default function WishlistPageClient({ items: initialItems }: WishlistPageClientProps) {
    const [items, setItems] = useState(initialItems)
    const { moveToCart, setMoveToCart } = useMoveToCart()

    const handleRemove = (productId: number) => {
        setItems(prev => prev.filter(item => item.product.id !== productId))
    }

    if (items.length === 0) {
        return (
            <section className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/40">
                    <Heart className="h-8 w-8 text-purple-400" />
                </div>
                <p className="font-primary text-lg text-white/80 mb-4">
                    Tu wishlist está vacío
                </p>
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 rounded-md border border-purple-500/30 bg-purple-900/40 px-5 py-2.5 text-sm font-secondary text-white transition hover:bg-purple-800/60"
                >
                    Seguir comprando
                </Link>
            </section>
        )
    }

    return (
        <section className="flex flex-col justify-between items-center gap-5">
            <div className="text-2xl text-white text-center">
                <h1 className="font-medium font-secondary">Mi wishlist</h1>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={moveToCart}
                    onChange={e => setMoveToCart(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/30 bg-purple-900/40 text-purple-500 focus:ring-purple-500 accent-purple-500"
                />
                <span className="text-sm text-white/70 font-secondary">
                    Quitar de wishlist al agregar al carrito
                </span>
            </label>
            <div className="flex flex-col justify-items-center gap-10">
                <div className="flex flex-col justify-center items-center gap-8 lg:grid lg:grid-cols-2">
                    {items.map(item => (
                        <WishlistProductCard
                            key={item.id}
                            product={item.product}
                            onRemove={handleRemove}
                            moveToCart={moveToCart}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
