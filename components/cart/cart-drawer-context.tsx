"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface CartDrawerContextValue {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null)

export function CartDrawerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    const toggle = () => setIsOpen(prev => !prev)

    return (
        <CartDrawerContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
        </CartDrawerContext.Provider>
    )
}

export function useCartDrawer() {
    const context = useContext(CartDrawerContext)
    if (!context) {
        throw new Error("useCartDrawer must be used within a CartDrawerProvider")
    }
    return context
}
