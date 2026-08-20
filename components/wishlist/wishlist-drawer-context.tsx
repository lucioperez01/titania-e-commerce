"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface WishlistDrawerContextValue {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

const WishlistDrawerContext = createContext<WishlistDrawerContextValue | null>(null)

export function WishlistDrawerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    const toggle = () => setIsOpen(prev => !prev)

    return (
        <WishlistDrawerContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
        </WishlistDrawerContext.Provider>
    )
}

export function useWishlistDrawer() {
    const context = useContext(WishlistDrawerContext)
    if (!context) throw new Error("useWishlistDrawer must be used within WishlistDrawerProvider")
    return context
}
