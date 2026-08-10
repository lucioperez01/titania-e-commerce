/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import ProductsClient from "@/app/(dashboard)/dashboard/products/ProductClient"

const mockToggleProductOnlineAction = jest.fn()

jest.mock("@/app/(dashboard)/actions", () => ({
    createProductAction: jest.fn(),
    updateProductAction: jest.fn(),
    deleteProductAction: jest.fn(),
    toggleProductOnlineAction: (...args: unknown[]) => mockToggleProductOnlineAction(...args),
}))

jest.mock("@/components/dashboard/product-modal", () => {
    return function ProductModal() {
        return <div data-testid="product-modal">Modal</div>
    }
})

const categories = [{ id: 1, name: "Ropa", slug: "ropa" }]

const products = [
    { id: 1, name: "Remera", slug: "remera", price: 25000, stock: 10, images: [], category: categories[0], brand: "Marca", isOnline: true },
    { id: 2, name: "Pantalón", slug: "pantalon", price: 30000, stock: 5, images: [], category: categories[0], brand: "Marca", isOnline: false },
]

describe("ProductsClient", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders the online column with status badges", () => {
        render(<ProductsClient categories={categories} products={products} />)

        expect(screen.getByRole("columnheader", { name: /Online/i })).toBeInTheDocument()
        const table = screen.getByRole("table")
        const statusButtons = within(table).getAllByRole("button", { name: /cambiar estado/i })
        expect(statusButtons).toHaveLength(2)
        expect(statusButtons[0]).toHaveTextContent("Online")
        expect(statusButtons[1]).toHaveTextContent("Offline")
    })

    it("calls toggleProductOnlineAction when the online toggle is clicked", async () => {
        mockToggleProductOnlineAction.mockResolvedValue({ success: true })
        render(<ProductsClient categories={categories} products={products} />)

        const table = screen.getByRole("table")
        const toggleButtons = within(table).getAllByRole("button", { name: /cambiar estado/i })
        expect(toggleButtons).toHaveLength(2)

        await act(async () => {
            await userEvent.click(toggleButtons[0])
        })

        expect(mockToggleProductOnlineAction).toHaveBeenCalledWith(1, false)
    })
})
