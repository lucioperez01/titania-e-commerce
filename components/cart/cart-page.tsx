"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CartItemList from "./cart-item-list"
import { useCart } from "./cart-provider"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import AddToCartButton from "./add-to-cart-button"
import { Truck, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

interface CartPageProps {
  products: ProductDTO[]
}

const SHIPPING_COST = 14000
const TAX_RATE = 0.21
const FREE_SHIPPING_THRESHOLD = 50000

export default function CartPage({ products }: CartPageProps) {
    const { state } = useCart()

    const subtotal = state.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId)
        if (!product) return sum
        return sum + product.price * item.quantity
    }, 0)

    const taxes = subtotal * TAX_RATE
    const total = subtotal + (subtotal === 0 ? 0 : SHIPPING_COST + taxes)
    const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0)
    const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
    const recommendedProducts = products
        .filter(product => !state.items.some(item => item.productId === product.id))
        .slice(0, 2)

    if (state.isHydrating) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-purple-900/40 animate-pulse">
                    <ShoppingBag className="h-12 w-12 text-purple-400" />
                </div>
                <p className="text-sm text-white/70">Cargando carrito...</p>
            </div>
        )
    }

    if (state.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-purple-900/40">
                    <ShoppingBag className="h-12 w-12 text-purple-400" />
                </div>
                <h2 className="font-primary text-2xl font-semibold text-white">Tu carrito está vacío</h2>
                <p className="mt-2 text-sm text-white/70">Agregá productos para continuar</p>
                <Link
                    href="/shop"
                    className="mt-6 inline-flex items-center gap-2 rounded-md border border-purple-500/30 bg-purple-900/40 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-800/60"
                >
                    <ShoppingBag className="h-4 w-4" />
                    Seguir comprando
                </Link>
            </div>
        )
    }

    return (
        <>
            <h1 className="text-2xl font-bold text-white mb-5">Carrito</h1>
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <section className="rounded-md border border-slate-200/10 p-5 min-h-128">
            <CartItemList products={products} />

            <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-900/30 p-4 text-slate-300">
                <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-400" />
                    <p className="text-sm font-medium text-white">
                        {isFreeShipping ? "¡Envío gratis!" : `Te faltan $${remainingForFreeShipping.toLocaleString("es-AR")} para envío gratis!`}
                    </p>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isFreeShipping ? "bg-purple-400" : "bg-purple-500"
                        )}
                        style={{ width: `${shippingProgress}%` }}
                    />
                </div>
                {!isFreeShipping && (
                    <p className="mt-2 text-xs text-white/60">
                        Comprá por ${FREE_SHIPPING_THRESHOLD.toLocaleString("es-AR")} o más y el envío es gratis
                    </p>
                )}
            </div>

            {recommendedProducts.length > 0 && (
            <div className="mt-10 border-t border-slate-200/30 pt-6">
                <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-200 font-bold">Sugerencias</p>
                    <h3 className="text-xl font-semibold text-white">Te puede interesar</h3>
                </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                {recommendedProducts.map(product => (
                    <div key={product.id} className="rounded-md border border-slate-200/10 p-4">
                    <div className="mb-3 flex min-w-0 items-center gap-3">
                        <Image
                        src={product.images[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="rounded-md object-cover"
                        />
                        <div className="min-w-0">
                        <p className="font-semibold text-white overflow-hidden whitespace-nowrap text-ellipsis">{product.name}</p>
                        <p className="text-sm text-slate-400">${product.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                        <Link href={`/product/${product.slug}`} className="w-full">
                        Ver producto
                        </Link>
                    </Button>

                    <div className="mt-2"> 
                        <AddToCartButton productId={product.id} stock={product.stock} />
                    </div>
                    
                    </div>
                ))}
                </div>
                <div className="mt-6 flex flex-col gap-3">
            <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-md border border-slate-200/10 bg-indigo-500/20 px-4 py-3 text-sm text-white transition hover:bg-purple-800"
            >
                Seguir comprando
            </Link>
            </div>
            </div>
            )}
        </section>

        <aside className="rounded-md border border-slate-200/10 p-5 text-white shadow-sm shadow-purple-500/10 xl:sticky xl:top-6 xl:min-h-[32rem]">
            <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Resumen</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Checkout</h2>
            </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
            El envío está hardcodeado por ahora. Más adelante lo traemos desde la API y mostramos el cálculo real.
            </p>

            <div className="mt-6 space-y-4 rounded-xl border border-slate-200/10 p-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Envío</span>
                <span>${subtotal === 0 ? 0 : SHIPPING_COST.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/10 pt-4 text-sm text-slate-300">
                <div>
                <p>Impuestos nacionales</p>
                <p className="text-xs text-slate-200/30">IVA 21% incluido según ley Argentina</p>
                </div>
                <span>${taxes.toFixed(2)}</span>
            </div>

            <div className="border-t border-slate-200/10 pt-4">
                <div className="flex items-center justify-between text-lg font-semibold text-white">
                <span>Total final</span>
                <span>${total.toFixed(2)}</span>
                </div>
            </div>
            </div>

            <div className="mt-6">
                { subtotal === 0 ? undefined : <Link href="/checkout">
                    <Button variant="secondary" className="w-full" size="lg">
                        Comprar ahora
                    </Button>
                </Link>}
            </div>
        </aside>
        </div>
        </>
    )
    }
