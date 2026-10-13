"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart/cart-provider"

interface BuyNowButtonProps {
    productId: number
    stock: number
    variantId?: number
}

export default function BuyNowButton({ productId, stock, variantId }: BuyNowButtonProps) {
    const router = useRouter()
    const { dispatch } = useCart()

    const handleBuyNow = () => {
        if (stock <= 0) return

        // Agregar al carrito
        dispatch({
            type: "ADD",
            productId,
            quantity: 1,
            stock,
            variantId,
        })

        // Ir directo al checkout
        router.push("/checkout")
    }

    const isDisabled = stock <= 0

    return (
        <Button
            variant="outline"
            className="w-full cursor-pointer text-black text-md font-light font-primary py-5"
            onClick={handleBuyNow}
            disabled={isDisabled}
        >
            {isDisabled ? "Sin stock" : "Comprar ahora"}
        </Button>
    )
}
