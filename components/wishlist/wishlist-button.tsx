"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { useWishlist } from "./wishlist-provider"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface WishlistButtonProps {
    productId: number
    className?: string
}

export default function WishlistButton({ productId, className }: WishlistButtonProps) {
    const { toggle, isInWishlist } = useWishlist()
    const { showToast } = useToast()
    const inWishlist = isInWishlist(productId)
    const [isPending, setIsPending] = useState(false)

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isPending) return
        setIsPending(true)

        const wasInWishlist = inWishlist
        toggle(productId)

        showToast(
            wasInWishlist ? "Quitado de tu wishlist" : "Agregado a tu wishlist",
            wasInWishlist ? undefined : { href: "/wishlist", label: "Ver" }
        )

        setTimeout(() => setIsPending(false), 400)
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className={cn(
                "p-2 rounded-full transition-all duration-200 cursor-pointer",
                inWishlist
                    ? "text-purple-400"
                    : "text-white/60 hover:text-white hover:bg-purple-900/30",
                isPending && "pointer-events-none",
                className
            )}
            aria-label={inWishlist ? "Quitar de wishlist" : "Agregar a wishlist"}
        >
            {isPending ? (
                <span className="block w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            ) : (
                <Heart
                    className={cn("w-5 h-5 transition-all duration-200", inWishlist && "fill-purple-400 stroke-white scale-110")}
                />
            )}
        </button>
    )
}
