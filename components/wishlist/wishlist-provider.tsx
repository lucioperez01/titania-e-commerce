"use client"

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"

type WishlistState = {
    productIds: number[]
    isHydrating: boolean
}

type WishlistAction =
    | { type: "TOGGLE"; productId: number }
    | { type: "HYDRATE"; productIds: number[] }
    | { type: "SET_HYDRATING"; isHydrating: boolean }

const STORAGE_KEY = "titania-wishlist"

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
    switch (action.type) {
        case "TOGGLE": {
            const exists = state.productIds.includes(action.productId)
            return {
                ...state,
                productIds: exists
                    ? state.productIds.filter(id => id !== action.productId)
                    : [...state.productIds, action.productId],
            }
        }
        case "HYDRATE":
            return { ...state, productIds: action.productIds, isHydrating: false }
        case "SET_HYDRATING":
            return { ...state, isHydrating: action.isHydrating }
        default:
            return state
    }
}

interface WishlistContextValue {
    state: WishlistState
    toggle: (productId: number) => void
    isInWishlist: (productId: number) => boolean
    count: number
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(wishlistReducer, { productIds: [], isHydrating: true })
    const { data: session } = useSession()
    const userId = session?.user?.id ? Number(session.user.id) : null

    const hasMerged = useRef(false)
    const prevProductIdsRef = useRef<number[]>([])

    useEffect(() => {
        if (typeof window === "undefined") return
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as number[]
                dispatch({ type: "HYDRATE", productIds: parsed })
            } catch {
                localStorage.removeItem(STORAGE_KEY)
                dispatch({ type: "SET_HYDRATING", isHydrating: false })
            }
        } else {
            dispatch({ type: "SET_HYDRATING", isHydrating: false })
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!userId) return
        if (state.isHydrating) return

        const localIds = state.productIds

        async function mergeAndHydrate() {
            // Wait a bit for session to be fully available
            await new Promise(resolve => setTimeout(resolve, 300))

            // Merge local items to DB
            if (localIds.length > 0) {
                const results = await Promise.allSettled(
                    localIds.map(id =>
                        fetch("/api/wishlist", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ productId: id }),
                        })
                    )
                )
                
                const failed = results.filter(r => r.status === "rejected")
                if (failed.length > 0) {
                    console.warn(`Wishlist merge: ${failed.length}/${localIds.length} POSTs failed`)
                    // Retry once after 500ms
                    await new Promise(resolve => setTimeout(resolve, 500))
                    await Promise.allSettled(
                        localIds.map(id =>
                            fetch("/api/wishlist", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ productId: id }),
                            })
                        )
                    )
                }
                localStorage.removeItem(STORAGE_KEY)
            }

            // Fetch from DB to hydrate
            try {
                const res = await fetch("/api/wishlist")
                if (res.ok) {
                    const data = await res.json()
                    const dbIds = (data.items ?? []).map((item: { product: { id: number } }) => item.product.id)
                    dispatch({ type: "HYDRATE", productIds: dbIds })
                    hasMerged.current = true
                    console.log(`Wishlist hydrated from DB: ${dbIds.length} items`)
                } else {
                    console.warn(`Wishlist GET failed with status ${res.status}`)
                }
            } catch (err) {
                console.warn("Wishlist GET failed:", err)
                // Keep local items if GET fails
                dispatch({ type: "SET_HYDRATING", isHydrating: false })
            }
        }

        if (!hasMerged.current) {
            mergeAndHydrate()
        }
    }, [userId, state.isHydrating])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (state.isHydrating) return

        if (!userId) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.productIds))
            prevProductIdsRef.current = state.productIds
            return
        }

        if (!hasMerged.current) return

        const prevIds = prevProductIdsRef.current
        const currentIds = state.productIds

        const addedIds = currentIds.filter(id => !prevIds.includes(id))
        const removedIds = prevIds.filter(id => !currentIds.includes(id))

        prevProductIdsRef.current = currentIds

        for (const productId of addedIds) {
            fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
            }).catch(() => {})
        }

        for (const productId of removedIds) {
            fetch(`/api/wishlist?productId=${productId}`, {
                method: "DELETE",
            }).catch(() => {})
        }
    }, [state.productIds, userId, state.isHydrating])

    const toggle = useCallback((productId: number) => {
        dispatch({ type: "TOGGLE", productId })
    }, [])

    const isInWishlist = useCallback((productId: number) => {
        return state.productIds.includes(productId)
    }, [state.productIds])

    const count = state.productIds.length

    return (
        <WishlistContext.Provider value={{ state, toggle, isInWishlist, count }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (!context) {
        throw new Error("useWishlist must be used within a WishlistProvider")
    }
    return context
}
