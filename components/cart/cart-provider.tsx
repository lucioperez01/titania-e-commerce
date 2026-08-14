"use client"

import { createContext, useContext, useEffect, useReducer, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { CartItemDTO } from "@/Interfaces/dto/cart.dto"
import { getCart } from "@/domain/cart/use-cases/get-cart"
import { addToCart } from "@/domain/cart/use-cases/add-to-cart"
import { PrismaCartRepository } from "@/infrastructure/repositories/PrismaCartRepository"

const STORAGE_KEY = "titania-cart"
const ANON_CART_STORAGE_KEY = "titania-anon-cart"

export interface CartState {
    items: CartItemDTO[]
    isHydrating: boolean
    stockWarning?: string
}

export type CartAction =
    | { type: "ADD"; productId: number; quantity: number; variantId?: number | null; stock?: number }
    | { type: "REMOVE"; productId: number; variantId?: number | null }
    | { type: "UPDATE_QTY"; productId: number; quantity: number; variantId?: number | null; stock?: number }
    | { type: "CLEAR" }
    | { type: "HYDRATE"; items: CartItemDTO[] }
    | { type: "SET_HYDRATING"; isHydrating: boolean }
    | { type: "SET_STOCK_WARNING"; warning?: string }

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
                return { items: nextItems, isHydrating: state.isHydrating, stockWarning: state.stockWarning }
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
                isHydrating: state.isHydrating,
                stockWarning: state.stockWarning,
            }
        }
        case "REMOVE": {
            const targetVariant = action.variantId ?? null
            return {
                items: state.items.filter(
                    item => !(item.productId === action.productId && item.variantId === targetVariant)
                ),
                isHydrating: state.isHydrating,
                stockWarning: state.stockWarning,
            }
        }
        case "UPDATE_QTY": {
            const targetVariant = action.variantId ?? null
            if (action.quantity === 0) {
                return {
                    items: state.items.filter(
                        item => !(item.productId === action.productId && item.variantId === targetVariant)
                    ),
                    isHydrating: state.isHydrating,
                    stockWarning: state.stockWarning,
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
                isHydrating: state.isHydrating,
                stockWarning: state.stockWarning,
            }
        }
        case "CLEAR": {
            return { items: [], isHydrating: state.isHydrating, stockWarning: state.stockWarning }
        }
        case "HYDRATE": {
            return { items: action.items, isHydrating: false, stockWarning: state.stockWarning }
        }
        case "SET_HYDRATING": {
            return { ...state, isHydrating: action.isHydrating }
        }
        case "SET_STOCK_WARNING": {
            return { ...state, stockWarning: action.warning }
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

// Cart repository instance for DB operations
const cartRepository = new PrismaCartRepository()

export function CartProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [], isHydrating: false })
    const { data: session } = useSession()
    const sessionUserId = session?.user?.id ? Number(session.user.id) : null

    // Initial load from localStorage (guest mode)
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

    // DB hydration when session user ID is available
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!sessionUserId) return

        async function hydrateFromDB() {
            dispatch({ type: "SET_HYDRATING", isHydrating: true })
            try {
                const dbCart = await getCart(cartRepository, sessionUserId)
                if (dbCart.items.length > 0) {
                    dispatch({ type: "HYDRATE", items: dbCart.items })
                    // Clear localStorage since we now use DB
                    window.localStorage.removeItem(STORAGE_KEY)
                } else {
                    dispatch({ type: "SET_HYDRATING", isHydrating: false })
                }
            } catch {
                dispatch({ type: "SET_HYDRATING", isHydrating: false })
            }
        }

        hydrateFromDB()
    }, [sessionUserId])

    // Persist to localStorage for guests, or to DB for logged-in users
    useEffect(() => {
        if (typeof window === "undefined") return
        if (state.isHydrating) return

        if (sessionUserId) {
            // Logged in: persist last item change to DB (incremental)
            // Only persist if there are items and the change was user-initiated
            const persistToDB = async () => {
                try {
                    const dbCart = await getCart(cartRepository, sessionUserId)
                    const cartId = dbCart.id
                    if (cartId > 0 && state.items.length > 0) {
                        // Persist each item (in production, batch this)
                        for (const item of state.items) {
                            await addToCart(cartRepository, cartId, item.productId, item.quantity, item.variantId ?? null)
                        }
                    }
                } catch {
                    // Silently fail — DB persistence is best-effort
                }
            }
            persistToDB()
        } else {
            // Guest: persist to localStorage
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
        }
    }, [state.items, sessionUserId, state.isHydrating])

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
