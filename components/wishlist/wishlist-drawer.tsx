"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Heart, ShoppingCart } from "lucide-react"
import { useWishlistDrawer } from "./wishlist-drawer-context"
import { useWishlist } from "./wishlist-provider"
import { useCart } from "@/components/cart/cart-provider"
import { useToast } from "@/components/ui/toast"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import CartDrawerSkeleton from "@/components/skeletons/cart-drawer-skeleton"

interface WishlistItemWithProduct {
    id: number
    product: ProductDTO
}

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

export default function WishlistDrawer() {
    const { isOpen, close } = useWishlistDrawer()
    const { state, toggle: toggleWishlist, isInWishlist } = useWishlist()
    const { dispatch: cartDispatch } = useCart()
    const { showToast } = useToast()
    const [items, setItems] = useState<WishlistItemWithProduct[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [addingToCart, setAddingToCart] = useState<number | null>(null)
    const { moveToCart, setMoveToCart } = useMoveToCart()

    useEffect(() => {
        if (!isOpen) return

        async function fetchWishlist() {
            setIsLoading(true)
            
            const productIds = state.productIds

            const res = await fetch("/api/wishlist")
            if (res.ok) {
                const data = await res.json()
                setItems(data.items ?? [])
            } else {
                if (productIds.length > 0) {
                    const productsRes = await fetch(`/api/products?ids=${productIds.join(",")}`)
                    if (productsRes.ok) {
                        const products = await productsRes.json()
                        const itemsWithProduct = products.map((p: ProductDTO) => ({
                            id: p.id,
                            product: p,
                        }))
                        setItems(itemsWithProduct)
                    } else {
                        setItems([])
                    }
                } else {
                    setItems([])
                }
            }
            
            setIsLoading(false)
        }

        fetchWishlist()
    }, [isOpen, state.productIds])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
        },
        [close]
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
            return () => document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, handleKeyDown])

    const handleRemove = (productId: number) => {
        toggleWishlist(productId)
        setItems(prev => prev.filter(item => item.product.id !== productId))
        showToast("Quitado de tu wishlist")
    }

    const handleAddToCart = (item: WishlistItemWithProduct) => {
        setAddingToCart(item.product.id)
        cartDispatch({ type: "ADD", productId: item.product.id, quantity: 1, stock: item.product.stock })

        if (moveToCart) {
            toggleWishlist(item.product.id)
            setItems(prev => prev.filter(i => i.product.id !== item.product.id))
            showToast("Movido al carrito")
        } else {
            showToast("Agregado al carrito")
        }

        setTimeout(() => setAddingToCart(null), 400)
    }

    return (
        <>
            <div
                className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={close}
            />
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-purple-950/95 backdrop-blur-md border-l border-purple-500/20 transform transition-transform duration-300 ease-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-purple-500/10">
                        <div className="flex items-center gap-3">
                            <h2 className="font-primary text-lg tracking-[0.15em] uppercase text-white">
                                Mi wishlist
                            </h2>
                            {items.length > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-700/50 px-1.5 text-[11px] text-white font-secondary">
                                    {items.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={close}
                            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-purple-800/40 transition-colors cursor-pointer"
                            aria-label="Cerrar wishlist"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/40">
                                    <Heart className="h-8 w-8 text-purple-400" />
                                </div>
                                <p className="font-primary text-sm text-white/80 mb-4">
                                    Tu wishlist está vacío
                                </p>
                                <Link
                                    href="/shop"
                                    onClick={close}
                                    className="inline-flex items-center gap-2 rounded-md border border-purple-500/30 bg-purple-900/40 px-5 py-2.5 text-sm font-secondary text-white transition hover:bg-purple-800/60"
                                >
                                    Seguir comprando
                                </Link>
                            </div>
                        ) : isLoading ? (
                            <CartDrawerSkeleton />
                        ) : (
                            <ul className="divide-y divide-purple-500/10">
                                {items.map(item => (
                                    <li
                                        key={item.id}
                                        className="flex gap-3 p-4"
                                    >
                                        <Image
                                            src={item.product.images[0]?.url || "/placeholder.svg"}
                                            alt={item.product.name}
                                            width={80}
                                            height={80}
                                            className="w-15 h-18 rounded-md object-cover shrink-0"
                                        />
                                        <div className="grid grid-cols-2 min-w-0 justify-between align-center items-center gap-2 w-full">
                                            <div>
                                                <p className="font-secondary text-lg text-white truncate">
                                                    {item.product.name}
                                                </p>
                                                <p className="font-secondary text-sm text-purple-300 mt-0.5">
                                                    ${item.product.price.toFixed(2)}
                                                </p>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    disabled={addingToCart === item.product.id || item.product.stock <= 0}
                                                    className="mt-2 w-full flex items-center justify-center gap-1.5 border border-purple-500/30 bg-purple-900/40 hover:bg-purple-800/60 text-white py-1.5 rounded-md font-secondary text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {addingToCart === item.product.id ? (
                                                        <span className="block w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                                                    ) : (
                                                        <ShoppingCart className="w-3.5 h-3.5" />
                                                    )}
                                                    Agregar
                                                </button>
                                            </div>
                                             
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={() => handleRemove(item.product.id)}
                                                    className="p-1.5 text-purple-400 hover:text-red-400 transition-colors cursor-pointer"
                                                    aria-label="Quitar de wishlist"
                                                >
                                                    <Heart className="w-4 h-4 fill-purple-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {items.length > 0 && !isLoading && (
                        <div className="border-t border-purple-500/10 p-4 flex flex-col gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={moveToCart}
                                    onChange={e => setMoveToCart(e.target.checked)}
                                    className="w-4 h-4 rounded border-purple-500/30 bg-purple-900/40 text-purple-500 focus:ring-purple-500 accent-purple-500"
                                />
                                <span className="text-xs text-white/70 font-secondary">
                                    Quitar de wishlist al agregar al carrito
                                </span>
                            </label>
                            <Link
                                href="/wishlist"
                                onClick={close}
                                className="block w-full text-center border border-purple-500/30 bg-purple-900/40 hover:bg-purple-800/60 text-white py-3 rounded-md font-secondary text-sm uppercase tracking-wider transition-colors"
                            >
                                Ver wishlist completa
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
