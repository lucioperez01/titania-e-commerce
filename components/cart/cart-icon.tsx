"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "./cart-provider"

export default function CartIcon() {
    const { itemCount } = useCart()

    return (
        <Link href="/cart" className="relative flex items-center">
            <ShoppingCart className="w-5 h-5 text-white" />
            {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {itemCount}
                </span>
            )}
        </Link>
    )
}
