"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CartItemList from "./cart-item-list"
import { useCart } from "./cart-provider"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import AddToCartButton from "./add-to-cart-button"

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
    const total = subtotal + subtotal === 0 ? 0 : SHIPPING_COST + taxes
    const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0)
    const recommendedProducts = products
        .filter(product => !state.items.some(item => item.productId === product.id))
        .slice(0, 2)

    return (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-md border border-slate-200/10 p-5 min-h-128">
            <CartItemList products={products} />

            <div className="mt-6 rounded-xl bg-linear-to-r from-indigo-500/20 to-purple-500/20  border border-slate-200/20 p-4 text-slate-300">
                <p className="text-sm font-medium text-white">Envio gratis</p>
                <p className="mt-1 text-sm  font-semibold text-indigo-200">
                    {remainingForFreeShipping > 0
                    ? `Agrega productos por AR$ ${remainingForFreeShipping.toFixed(2)} más y calificá para envío gratis.`
                    : "Ya calificás para envío gratis."}
                </p>
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
                { subtotal === 0 ? undefined : <Button variant="secondary" className="w-full" size="lg">
                    Comprar ahora
                </Button>}
            </div>
        </aside>
        </div>
    )
    }
