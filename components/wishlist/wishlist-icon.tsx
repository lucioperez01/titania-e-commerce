"use client"

import { Heart } from "lucide-react"
import { useWishlist } from "./wishlist-provider"
import { useWishlistDrawer } from "./wishlist-drawer-context"

export default function WishlistIcon() {
    const { count } = useWishlist()
    const { toggle } = useWishlistDrawer()

    return (
        <button onClick={toggle} className="relative flex items-center cursor-pointer" aria-label="Abrir wishlist">
            <Heart className="w-5 h-5 text-white" />
            {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] text-white">
                    {count > 99 ? "99" : count}
                </span>
            )}
        </button>
    )
}
