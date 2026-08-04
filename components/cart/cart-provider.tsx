"use client"

import { createContext, useContext, useEffect, useReducer, ReactNode } from "react"
import { CartItemDTO } from "@/Interfaces/dto/cart.dto"

const STORAGE_KEY = "titania-cart"

export interface CartState {
    items: CartItemDTO[]
}

export type CartAction =
    | { type: "ADD"; productId: number; quantity: number; variantId?: number | null; stock?: number }
    | { type: "REMOVE"; productId: number; variantId?: number | null }
    | { type: "UPDATE_QTY"; productId: number; quantity: number; variantId?: number | null; stock?: number }
    | { type: "CLEAR" }
    | { type: "HYDRATE"; items: CartItemDTO[] }

export function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "ADD": {
            const existingIndex = state.items.findIndex(
                item => item.productId === action.productId && item.variantId === (action.variantId ?? null)
            )
            const desiredQuantity =
                existingIndex >= 0 ? state.items[existingIndex].quantity + action.quantity : action.quantity

            if (action.stock !== undefined && desiredQuantity > action.stock) {
                return state
            }

            if (existingIndex >= 0) {
                const nextItems = [...state.items]
                nextItems[existingIndex] = {
                    ...nextItems[existingIndex],
                    quantity: desiredQuantity,
                }
                return { items: nextItems }
            }

            return {
                items: [
                    ...state.items,
                    {
                        productId: action.productId,
                        quantity: action.quantity,
                        variantId: action.variantId ?? null,
                    },
                ],
            }
        }
        case "REMOVE": {
            const targetVariant = action.variantId ?? null
            return {
                items: state.items.filter(
                    item => !(item.productId === action.productId && item.variantId === targetVariant)
                ),
            }
        }
        case "UPDATE_QTY": {
            const targetVariant = action.variantId ?? null
            if (action.quantity === 0) {
                return {
                    items: state.items.filter(
                        item => !(item.productId === action.productId && item.variantId === targetVariant)
                    ),
                }
            }

            if (action.stock !== undefined && action.quantity > action.stock) {
                return state
            }

            return {
                items: state.items.map(item =>
                    item.productId === action.productId && item.variantId === targetVariant
                        ? { ...item, quantity: action.quantity }
                        : item
                ),
            }
        }
        case "CLEAR": {
            return { items: [] }
        }
        case "HYDRATE": {
            return { items: action.items }
        }
        default: {
            return state
        }
    }
}

interface CartContextValue {
    state: CartState
    dispatch: React.Dispatch<CartAction>
    itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [] })

    useEffect(() => {
        if (typeof window === "undefined") return
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as CartItemDTO[]
                dispatch({ type: "HYDRATE", items: parsed })
            } catch {
                window.localStorage.removeItem(STORAGE_KEY)
            }
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }, [state.items])

    useEffect(() => {
        if (typeof window === "undefined") return
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== STORAGE_KEY) return
            const raw = event.newValue
            if (!raw) {
                dispatch({ type: "CLEAR" })
                return
            }
            try {
                const parsed = JSON.parse(raw) as CartItemDTO[]
                dispatch({ type: "HYDRATE", items: parsed })
            } catch {
                // ignore malformed external storage
            }
        }
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [])

    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

    return <CartContext.Provider value={{ state, dispatch, itemCount }}>{children}</CartContext.Provider>
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
