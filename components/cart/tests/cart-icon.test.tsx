/** @jest-environment jsdom */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { CartProvider } from "@/components/cart/cart-provider"
import CartIcon from "@/components/cart/cart-icon"

const STORAGE_KEY = "titania-cart"

describe("CartIcon", () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it("renders a link to /cart", () => {
        render(
            <CartProvider>
                <CartIcon />
            </CartProvider>
        )
        expect(screen.getByRole("link")).toHaveAttribute("href", "/cart")
    })

    it("shows the total item count in a badge", () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([{ productId: 1, quantity: 3, variantId: null }])
        )
        render(
            <CartProvider>
                <CartIcon />
            </CartProvider>
        )
        expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("hides the badge when the cart is empty", () => {
        render(
            <CartProvider>
                <CartIcon />
            </CartProvider>
        )
        expect(screen.queryByText("0")).not.toBeInTheDocument()
    })
})
