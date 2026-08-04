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

    const total = state.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId)
        if (!product) return sum
        return sum + product.price * item.quantity
    }, 0)

    return (
        <div className="flex flex-col gap-4">
            {state.items.length === 0 ? (
                <p className="text-white font-secondary">Tu carrito está vacío.</p>
            ) : (
                <ul className="flex flex-col gap-4">
                    {state.items.map(item => {
                        const product = products.find(p => p.id === item.productId)
                        if (!product) return null
                        return (
                            <li
                                key={item.productId}
                                className="flex items-center gap-4 rounded-md border border-slate-200/10 p-4 text-white"
                            >
                                <Image
                                    src={product.images[0]?.url || "/placeholder.svg"}
                                    alt={product.name}
                                    width={64}
                                    height={64}
                                    className="rounded-md object-cover"
                                />
                                <div className="flex-1">
                                    <p className="font-primary">{product.name}</p>
                                    <p className="font-secondary text-sm">${product.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon-xs"
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
                                        variant="outline"
                                        size="icon-xs"
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
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Remove"
                                    onClick={() => dispatch({ type: "REMOVE", productId: item.productId })}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            </li>
                        )
                    })}
                </ul>
            )}
            <div className="flex justify-between border-t border-slate-200/10 pt-4 text-white">
                <span className="font-primary text-lg">Total</span>
                <span className="font-primary text-lg" data-testid="cart-total">
                    ${total.toFixed(2)}
                </span>
            </div>
        </div>
    )
}
