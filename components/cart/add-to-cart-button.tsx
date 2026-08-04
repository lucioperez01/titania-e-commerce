"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "./cart-provider"

interface AddToCartButtonProps {
    productId: number
    stock?: number
}

export default function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
    const { state, dispatch } = useCart()
    const disabled = stock !== undefined && stock <= 0

    const currentQty = state.items
        .filter(item => item.productId === productId)
        .reduce((sum, item) => sum + item.quantity, 0)

    const showStockError =
        stock !== undefined && stock > 0 && currentQty >= stock

    return (
        <div className="flex flex-col gap-1 w-full">
            <Button
                variant="outline"
                className="w-full bg-transparent cursor-pointer text-white text-md font-light font-primary py-5"
                disabled={disabled || showStockError}
                onClick={() => dispatch({ type: "ADD", productId, quantity: 1, stock })}
            >
                Agregar al carrito 🛒
            </Button>
            {showStockError && (
                <span className="text-red-300 text-sm font-light font-primary">
                    Sin stock disponible para más unidades
                </span>
            )}
        </div>
    )
}