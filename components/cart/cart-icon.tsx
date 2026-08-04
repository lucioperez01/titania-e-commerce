"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "./cart-provider"

export default function CartIcon() {
    const { itemCount } = useCart()

    return (
        <Link href="/cart" className="relative">
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {itemCount}
                </span>
            )}
        </Link>
    )
}
