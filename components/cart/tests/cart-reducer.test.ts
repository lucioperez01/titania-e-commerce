import { cartReducer, CartState } from "@/components/cart/cart-provider"
import { CartItemDTO } from "@/Interfaces/dto/cart.dto"

describe("cartReducer", () => {
    const emptyState: CartState = { items: [] }

    it("ADD creates a new item when cart is empty", () => {
        const state = cartReducer(emptyState, { type: "ADD", productId: 5, quantity: 2, stock: 10 })
        expect(state.items).toHaveLength(1)
        expect(state.items[0]).toEqual({ productId: 5, quantity: 2, variantId: null })
    })

    it("ADD merges quantities for the same productId", () => {
        const initial: CartState = { items: [{ productId: 5, quantity: 2, variantId: null }] }
        const state = cartReducer(initial, { type: "ADD", productId: 5, quantity: 3, stock: 10 })
        expect(state.items).toHaveLength(1)
        expect(state.items[0].quantity).toBe(5)
    })

    it("ADD rejects when the resulting quantity exceeds stock", () => {
        const initial: CartState = { items: [{ productId: 5, quantity: 2, variantId: null }] }
        const state = cartReducer(initial, { type: "ADD", productId: 5, quantity: 5, stock: 3 })
        expect(state.items[0].quantity).toBe(2)
    })

    it("REMOVE removes an existing item by productId", () => {
        const initial: CartState = { items: [
            { productId: 5, quantity: 2, variantId: null },
            { productId: 8, quantity: 1, variantId: null },
        ]}
        const state = cartReducer(initial, { type: "REMOVE", productId: 5 })
        expect(state.items).toHaveLength(1)
        expect(state.items[0].productId).toBe(8)
    })

    it("REMOVE removes a specific variant without affecting others", () => {
        const initial: CartState = { items: [
            { productId: 5, quantity: 2, variantId: 1 },
            { productId: 5, quantity: 1, variantId: 2 },
        ]}
        const state = cartReducer(initial, { type: "REMOVE", productId: 5, variantId: 2 })
        expect(state.items).toHaveLength(1)
        expect(state.items[0]).toEqual({ productId: 5, quantity: 2, variantId: 1 })
    })

    it("REMOVE is idempotent when productId is not in cart", () => {
        const initial: CartState = { items: [{ productId: 5, quantity: 2, variantId: null }] }
        const state = cartReducer(initial, { type: "REMOVE", productId: 99 })
        expect(state.items).toHaveLength(1)
        expect(state.items[0].productId).toBe(5)
    })

    it("UPDATE_QTY changes the quantity of an existing item", () => {
        const initial: CartState = { items: [{ productId: 5, quantity: 2, variantId: null }] }
        const state = cartReducer(initial, { type: "UPDATE_QTY", productId: 5, quantity: 5, stock: 10 })
        expect(state.items[0].quantity).toBe(5)
    })

    it("UPDATE_QTY removes the item when quantity is set to zero", () => {
        const initial: CartState = { items: [{ productId: 5, quantity: 2, variantId: null }] }
        const state = cartReducer(initial, { type: "UPDATE_QTY", productId: 5, quantity: 0 })
        expect(state.items).toHaveLength(0)
    })

    it("UPDATE_QTY rejects when the requested quantity exceeds stock", () => {
        const initial: CartState = { items: [{ productId: 5, quantity: 2, variantId: null }] }
        const state = cartReducer(initial, { type: "UPDATE_QTY", productId: 5, quantity: 5, stock: 3 })
        expect(state.items[0].quantity).toBe(2)
    })

    it("UPDATE_QTY updates only the matching variant line", () => {
        const initial: CartState = { items: [
            { productId: 5, quantity: 2, variantId: 1 },
            { productId: 5, quantity: 3, variantId: 2 },
        ]}
        const state = cartReducer(initial, { type: "UPDATE_QTY", productId: 5, quantity: 5, variantId: 2, stock: 10 })
        expect(state.items).toHaveLength(2)
        expect(state.items[0]).toEqual({ productId: 5, quantity: 2, variantId: 1 })
        expect(state.items[1]).toEqual({ productId: 5, quantity: 5, variantId: 2 })
    })

    it("UPDATE_QTY with variantId set to zero removes only that variant line", () => {
        const initial: CartState = { items: [
            { productId: 5, quantity: 2, variantId: 1 },
            { productId: 5, quantity: 3, variantId: 2 },
        ]}
        const state = cartReducer(initial, { type: "UPDATE_QTY", productId: 5, quantity: 0, variantId: 2 })
        expect(state.items).toHaveLength(1)
        expect(state.items[0]).toEqual({ productId: 5, quantity: 2, variantId: 1 })
    })

    it("HYDRATE replaces the entire cart from storage", () => {
        const items: CartItemDTO[] = [{ productId: 5, quantity: 2, variantId: null }]
        const state = cartReducer(emptyState, { type: "HYDRATE", items })
        expect(state.items).toEqual(items)
    })

    it("CLEAR empties the cart", () => {
        const initial: CartState = { items: [{ productId: 5, quantity: 2, variantId: null }] }
        const state = cartReducer(initial, { type: "CLEAR" })
        expect(state.items).toHaveLength(0)
    })
})
