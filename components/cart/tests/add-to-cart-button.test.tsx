/** @jest-environment jsdom */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { CartProvider, useCart } from "@/components/cart/cart-provider"
import AddToCartButton from "@/components/cart/add-to-cart-button"

function DumpCart() {
    const { state, itemCount } = useCart()
    return (
        <div>
            <span data-testid="count">{itemCount}</span>
            {state.items.map(item => (
                <span key={item.productId} data-testid="item">{item.productId}:{item.quantity}</span>
            ))}
        </div>
    )
}

describe("AddToCartButton", () => {
    it("renders and dispatches ADD with productId on click", async () => {
        render(
            <CartProvider>
                <DumpCart />
                <AddToCartButton productId={5} stock={10} />
            </CartProvider>
        )
        const button = screen.getByRole("button", { name: /agregar al carrito/i })
        expect(button).toBeEnabled()
        await act(async () => {
            await userEvent.click(button)
        })
        expect(screen.getByTestId("count")).toHaveTextContent("1")
        expect(screen.getByTestId("item")).toHaveTextContent("5:1")
    })

    it("is disabled when stock is zero", () => {
        render(
            <CartProvider>
                <AddToCartButton productId={5} stock={0} />
            </CartProvider>
        )
        expect(screen.getByRole("button", { name: /agregar al carrito/i })).toBeDisabled()
    })

    it("shows stock error message when adding exceeds available stock", async () => {
        render(
            <CartProvider>
                <DumpCart />
                <AddToCartButton productId={5} stock={2} />
            </CartProvider>
        )
        const button = screen.getByRole("button", { name: /agregar al carrito/i })

        // Add 2 items (fills stock)
        await act(async () => {
            await userEvent.click(button)
        })
        await act(async () => {
            await userEvent.click(button)
        })
        expect(screen.getByTestId("count")).toHaveTextContent("2")

        // Third click should be rejected AND show error message
        await act(async () => {
            await userEvent.click(button)
        })
        expect(screen.getByTestId("count")).toHaveTextContent("2")
        expect(screen.getByText(/sin stock|out of stock|no hay/i)).toBeInTheDocument()
    })
})
