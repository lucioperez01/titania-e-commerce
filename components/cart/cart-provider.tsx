"use client"

import { createContext, useContext, useEffect, useReducer, useRef, useCallback, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { CartItemDTO } from "@/Interfaces/dto/cart.dto"
import { getCart } from "@/domain/cart/use-cases/get-cart"
import { addToCart } from "@/domain/cart/use-cases/add-to-cart"
import { mergeCart } from "@/domain/cart/use-cases/merge-cart"
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
    const [state, dispatch] = useReducer(cartReducer, { items: [], isHydrating: true })
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
        dispatch({ type: "SET_HYDRATING", isHydrating: false })
    }, [])

    // DB hydration when session user ID is available
    const hasHydratedFromDB = useRef(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!sessionUserId) return
        if (hasHydratedFromDB.current) return

        async function hydrateFromDB(uid: number) {
            dispatch({ type: "SET_HYDRATING", isHydrating: true })
            try {
                const localRaw = window.localStorage.getItem(STORAGE_KEY)
                let localItems: CartItemDTO[] = []
                if (localRaw) {
                    try {
                        localItems = JSON.parse(localRaw) as CartItemDTO[]
                    } catch {
                        window.localStorage.removeItem(STORAGE_KEY)
                    }
                }

                if (localItems.length > 0) {
                    let mergeSucceeded = false
                    try {
                        await mergeCart(
                            cartRepository,
                            uid,
                            localItems.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId ?? null }))
                        )
                        mergeSucceeded = true
                    } catch {
                        // Merge failed — keep localStorage items as fallback
                    }
                    if (mergeSucceeded) {
                        window.localStorage.removeItem(STORAGE_KEY)
                    }
                }

                try {
                    const dbCart = await getCart(cartRepository, uid)
                    if (dbCart.items.length > 0) {
                        dispatch({ type: "HYDRATE", items: dbCart.items })
                    } else if (localItems.length > 0) {
                        // DB is empty but we had localStorage items — restore them
                        dispatch({ type: "HYDRATE", items: localItems })
                    }
                } catch {
                    // DB read failed — restore from localStorage if available
                    if (localItems.length > 0) {
                        dispatch({ type: "HYDRATE", items: localItems })
                    }
                }
            } finally {
                dispatch({ type: "SET_HYDRATING", isHydrating: false })
            }
            hasHydratedFromDB.current = true
        }

        hydrateFromDB(sessionUserId)
    }, [sessionUserId])

    // Persist to localStorage for guests, or to DB for logged-in users
    const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        if (state.isHydrating) return

        if (sessionUserId) {
            if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
            persistTimerRef.current = setTimeout(async () => {
                try {
                    const dbCart = await getCart(cartRepository, sessionUserId)
                    const cartId = dbCart.id
                    if (cartId > 0 && state.items.length > 0) {
                        for (const item of state.items) {
                            await addToCart(cartRepository, cartId, item.productId, item.quantity, item.variantId ?? null)
                        }
                    }
                } catch {
                    // Silently fail — DB persistence is best-effort
                }
            }, 300)
        } else {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
        }

        return () => {
            if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
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
