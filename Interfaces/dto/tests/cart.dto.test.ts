import { CartItemDTO } from "@/Interfaces/dto/cart.dto"

describe("CartItemDTO", () => {
    it("should accept a minimal cart item with productId and quantity", () => {
        const item: CartItemDTO = { productId: 5, quantity: 2 }
        expect(item.productId).toBe(5)
        expect(item.quantity).toBe(2)
    })

    it("should accept a cart item with an optional variantId", () => {
        const item: CartItemDTO = { productId: 5, quantity: 2, variantId: 10 }
        expect(item.variantId).toBe(10)
    })
})
