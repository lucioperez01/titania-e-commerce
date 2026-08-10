"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useCart } from "./cart-provider"
import { ProductDTO } from "@/Interfaces/dto/product.dto"

interface CartItemListProps {
    products: ProductDTO[]
}

export default function CartItemList({ products }: CartItemListProps) {
    const { state, dispatch } = useCart()
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <div className="flex flex-col gap-6">
            <div className="border-b border-slate-200/30 p-2">
                <p className="text-md uppercase tracking-[0.24em] text-slate-200 font-bold">Tu carrito</p>
                <h2 className=" text-4xl font-semibold text-white">Resumen del carrito</h2>
                <p className="mb-2 text-md text-slate-300">
                    Revisa tus productos antes de comprar. {itemCount} {itemCount === 1 ? "producto" : "productos"} en tu carrito.
                </p>
            </div>

            {state.items.length === 0 ? (
                <p className="text-white font-secondary">Tu carrito está vacío.</p>
            ) : (
                <ul className="flex flex-col gap-4">
                    {state.items.map(item => {
                        const product = products.find(p => p.id === item.productId)
                        if (!product) return null
                        const lineTotal = product.price * item.quantity
                        return (
                            <li
                                key={item.productId}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-slate-200/10 p-4 text-white"
                            >
                                <div className="flex items-start gap-4 min-w-0">
                                    <Image
                                        src={product.images[0]?.url || "/placeholder.svg"}
                                        alt={product.name}
                                        width={64}
                                        height={64}
                                        className="rounded-md object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-primary text-lg overflow-hidden whitespace-nowrap text-ellipsis">{product.name}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-200">
                                            <span>${product.price.toFixed(2)}</span>
                                            <span>· Cantidad {item.quantity}</span>
                                            <span className="text-slate-300">Total ${lineTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Decrease quantity"
                                        onClick={() =>
                                            dispatch({
                                                type: "UPDATE_QTY",
                                                productId: item.productId,
                                                quantity: item.quantity - 1,
                                                stock: product.stock,
                                            })
                                        }
                                    >
                                        <Minus className="size-3" />
                                    </Button>
                                    <span className="w-8 text-center font-primary">{item.quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Increase quantity"
                                        onClick={() =>
                                            dispatch({
                                                type: "UPDATE_QTY",
                                                productId: item.productId,
                                                quantity: item.quantity + 1,
                                                stock: product.stock,
                                            })
                                        }
                                    >
                                        <Plus className="size-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Remove"
                                        onClick={() => dispatch({ type: "REMOVE", productId: item.productId })}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
