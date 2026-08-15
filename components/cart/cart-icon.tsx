"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "./cart-provider"
import { useCartDrawer } from "./cart-drawer-context"

export default function CartIcon() {
    const { itemCount } = useCart()
    const { toggle } = useCartDrawer()

    return (
        <button
            onClick={toggle}
            className="relative flex items-center cursor-pointer"
            aria-label="Abrir carrito"
        >
            <ShoppingCart className="w-5 h-5 text-white" />
            {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {itemCount}
                </span>
            )}
        </button>
    )
}
