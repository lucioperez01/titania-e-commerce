/** @jest-environment jsdom */

import "@testing-library/jest-dom"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CartProvider, useCart } from "@/components/cart/cart-provider"

const STORAGE_KEY = "titania-cart"

function DumpCart() {
    const { state, dispatch, itemCount } = useCart()
    return (
        <div>
            <span data-testid="count">{itemCount}</span>
            <button onClick={() => dispatch({ type: "ADD", productId: 5, quantity: 2, stock: 10 })}>
                Add
            </button>
            <button onClick={() => dispatch({ type: "CLEAR" })}>Clear</button>
            <ul>
                {state.items.map(item => (
                    <li key={item.productId} data-testid="cart-item">
                        {item.productId}:{item.quantity}
                    </li>
                ))}
            </ul>
        </div>
    )
}

describe("CartProvider localStorage", () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it("hydrates cart from localStorage on mount", () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ productId: 5, quantity: 2, variantId: null }]))
        render(
            <CartProvider>
                <DumpCart />
            </CartProvider>
        )
        expect(screen.getByTestId("count")).toHaveTextContent("2")
        expect(screen.getByTestId("cart-item")).toHaveTextContent("5:2")
    })

    it("persists cart to localStorage when dispatching ADD", async () => {
        render(
            <CartProvider>
                <DumpCart />
            </CartProvider>
        )
        await act(async () => {
            await userEvent.click(screen.getByText("Add"))
        })
        const raw = window.localStorage.getItem(STORAGE_KEY)
        expect(raw).toBeTruthy()
        expect(JSON.parse(raw!)).toEqual([{ productId: 5, quantity: 2, variantId: null }])
    })

    it("syncs cart across tabs via storage event", async () => {
        render(
            <CartProvider>
                <DumpCart />
            </CartProvider>
        )
        await act(async () => {
            await userEvent.click(screen.getByText("Add"))
        })
        await act(() => {
            window.dispatchEvent(
                new StorageEvent("storage", {
                    key: STORAGE_KEY,
                    newValue: JSON.stringify([
                        { productId: 5, quantity: 2, variantId: null },
                        { productId: 8, quantity: 1, variantId: null },
                    ]),
                })
            )
        })
        expect(screen.getAllByTestId("cart-item")).toHaveLength(2)
        expect(screen.getByTestId("count")).toHaveTextContent("3")
    })
})
