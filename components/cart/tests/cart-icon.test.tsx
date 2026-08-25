/** @jest-environment jsdom */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { CartProvider } from "@/components/cart/cart-provider"
import { CartDrawerProvider } from "@/components/cart/cart-drawer-context"
import CartIcon from "@/components/cart/cart-icon"

const STORAGE_KEY = "titania-cart"

describe("CartIcon", () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it("renders a button to open the cart drawer", () => {
        render(
            <CartProvider>
                <CartDrawerProvider>
                    <CartIcon />
                </CartDrawerProvider>
            </CartProvider>
        )
        expect(screen.getByRole("button", { name: /abrir carrito/i })).toBeInTheDocument()
    })

    it("shows the total item count in a badge", () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([{ productId: 1, quantity: 3, variantId: null }])
        )
        render(
            <CartProvider>
                <CartDrawerProvider>
                    <CartIcon />
                </CartDrawerProvider>
            </CartProvider>
        )
        expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("hides the badge when the cart is empty", () => {
        render(
            <CartProvider>
                <CartDrawerProvider>
                    <CartIcon />
                </CartDrawerProvider>
            </CartProvider>
        )
        expect(screen.queryByText("0")).not.toBeInTheDocument()
    })
})
