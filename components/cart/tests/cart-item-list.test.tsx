/** @jest-environment jsdom */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { CartProvider } from "@/components/cart/cart-provider"
import CartItemList from "@/components/cart/cart-item-list"
import { ProductDTO } from "@/Interfaces/dto/product.dto"

const mockProducts: ProductDTO[] = [
    {
        id: 5,
        name: "Product A",
        slug: "product-a",
        price: 100,
        images: [{ id: 1, url: "/a.jpg" }],
        category: { id: 1, name: "Cat", slug: "cat" },
        brand: "Brand",
        stock: 10,
        isOnline: true,
    },
    {
        id: 8,
        name: "Product B",
        slug: "product-b",
        price: 200,
        images: [{ id: 2, url: "/b.jpg" }],
        category: { id: 1, name: "Cat", slug: "cat" },
        brand: "Brand",
        stock: 5,
        isOnline: true,
    },
]

const STORAGE_KEY = "titania-cart"

describe("CartItemList", () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it("renders cart items with product names", () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([
                { productId: 5, quantity: 2, variantId: null },
                { productId: 8, quantity: 1, variantId: null },
            ])
        )
        render(
            <CartProvider>
                <CartItemList products={mockProducts} />
            </CartProvider>
        )
        expect(screen.getByText("Product A")).toBeInTheDocument()
        expect(screen.getByText("Product B")).toBeInTheDocument()
    })

    it("dispatches UPDATE_QTY when increasing quantity", async () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ productId: 5, quantity: 2, variantId: null }]))
        render(
            <CartProvider>
                <CartItemList products={mockProducts} />
            </CartProvider>
        )
        const buttons = screen.getAllByRole("button")
        const increase = buttons.find(b => b.getAttribute("aria-label") === "Increase quantity")
        expect(increase).toBeDefined()
        await act(async () => {
            await userEvent.click(increase!)
        })
        expect(screen.getByTestId("cart-total")).toHaveTextContent("$300.00")
    })

    it("dispatches UPDATE_QTY when decreasing quantity and removes at zero", async () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ productId: 5, quantity: 1, variantId: null }]))
        render(
            <CartProvider>
                <CartItemList products={mockProducts} />
            </CartProvider>
        )
        const buttons = screen.getAllByRole("button")
        const decrease = buttons.find(b => b.getAttribute("aria-label") === "Decrease quantity")
        expect(decrease).toBeDefined()
        await act(async () => {
            await userEvent.click(decrease!)
        })
        expect(screen.queryByText("Product A")).not.toBeInTheDocument()
    })

    it("dispatches REMOVE when clicking remove button", async () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ productId: 5, quantity: 2, variantId: null }]))
        render(
            <CartProvider>
                <CartItemList products={mockProducts} />
            </CartProvider>
        )
        await act(async () => {
            await userEvent.click(screen.getByRole("button", { name: /remove/i }))
        })
        expect(screen.queryByText("Product A")).not.toBeInTheDocument()
    })

    it("displays the cart total", () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([
                { productId: 5, quantity: 2, variantId: null },
                { productId: 8, quantity: 1, variantId: null },
            ])
        )
        render(
            <CartProvider>
                <CartItemList products={mockProducts} />
            </CartProvider>
        )
        expect(screen.getByTestId("cart-total")).toHaveTextContent("$400.00")
    })
})
