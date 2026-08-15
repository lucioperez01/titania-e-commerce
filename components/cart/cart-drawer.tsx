"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Trash2, ShoppingBag, Minus, Plus } from "lucide-react"
import { useCart } from "./cart-provider"
import { useCartDrawer } from "./cart-drawer-context"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import CartDrawerSkeleton from "@/components/skeletons/cart-drawer-skeleton"

export default function CartDrawer() {
    const { isOpen, close } = useCartDrawer()
    const { state, dispatch } = useCart()
    const [products, setProducts] = useState<ProductDTO[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        if (state.items.length === 0) {
            setProducts([])
            return
        }

        const productIds = state.items.map(item => item.productId)
        const uniqueIds = [...new Set(productIds)]

        async function fetchProducts() {
            setIsLoading(true)
            try {
                const res = await fetch(`/api/products?ids=${uniqueIds.join(",")}`)
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data)
                }
            } catch {
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [isOpen, state.items])

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

    const subtotal = state.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId)
        if (!product) return sum
        return sum + product.price * item.quantity
    }, 0)

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
                                Mi carrito
                            </h2>
                            {state.items.length > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-700/50 px-1.5 text-[11px] text-white font-secondary">
                                    {state.items.reduce((sum, item) => sum + item.quantity, 0)}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={close}
                            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-purple-800/40 transition-colors cursor-pointer"
                            aria-label="Cerrar carrito"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {state.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/40">
                                    <ShoppingBag className="h-8 w-8 text-purple-400" />
                                </div>
                                <p className="font-primary text-sm text-white/80 mb-4">
                                    Tu carrito está vacío
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
                                {state.items.map(item => {
                                    const product = products.find(p => p.id === item.productId)
                                    if (!product) return null
                                    return (
                                        <li
                                            key={`${item.productId}-${item.variantId ?? "default"}`}
                                            className="flex gap-3 p-4"
                                        >
                                            <Image
                                                src={product.images[0]?.url || "/placeholder.svg"}
                                                alt={product.name}
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 rounded-md object-cover shrink-0"
                                            />
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <p className="font-secondary text-sm text-white truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="font-secondary text-sm text-purple-300 mt-0.5">
                                                        ${product.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() =>
                                                                dispatch({
                                                                    type: "UPDATE_QTY",
                                                                    productId: item.productId,
                                                                    quantity: item.quantity - 1,
                                                                    stock: product.stock,
                                                                })
                                                            }
                                                            className="w-7 h-7 flex items-center justify-center rounded border border-purple-500/30 bg-purple-900/40 text-white hover:bg-purple-800/60 transition-colors cursor-pointer"
                                                            aria-label="Disminuir cantidad"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-sm text-white font-secondary">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                dispatch({
                                                                    type: "UPDATE_QTY",
                                                                    productId: item.productId,
                                                                    quantity: item.quantity + 1,
                                                                    stock: product.stock,
                                                                })
                                                            }
                                                            className="w-7 h-7 flex items-center justify-center rounded border border-purple-500/30 bg-purple-900/40 text-white hover:bg-purple-800/60 transition-colors cursor-pointer"
                                                            aria-label="Aumentar cantidad"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            dispatch({
                                                                type: "REMOVE",
                                                                productId: item.productId,
                                                                variantId: item.variantId,
                                                            })
                                                        }
                                                        className="p-1.5 text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                                                        aria-label="Eliminar producto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>

                    {state.items.length > 0 && !isLoading && (
                        <div className="border-t border-purple-500/10 p-4 space-y-3">
                            <div className="flex justify-between text-sm text-white/70">
                                <span className="font-secondary">Subtotal</span>
                                <span className="font-secondary text-white">${subtotal.toFixed(2)}</span>
                            </div>
                            <Link
                                href="/cart"
                                onClick={close}
                                className="block text-center text-sm text-white/60 hover:text-white underline underline-offset-4 transition-colors font-secondary"
                            >
                                Ver carrito completo
                            </Link>
                            <Link
                                href="/checkout"
                                onClick={close}
                                className="block w-full text-center border border-purple-500/30 bg-purple-900/40 hover:bg-purple-800/60 text-white py-3 rounded-md font-secondary text-sm uppercase tracking-wider transition-colors"
                            >
                                Ir al checkout
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
