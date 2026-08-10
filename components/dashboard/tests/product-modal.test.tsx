/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import ProductModal from "@/components/dashboard/product-modal"
import { ProductDTO } from "@/Interfaces/dto/product.dto"

const mockAction = jest.fn()

const categories = [{ id: 1, name: "Ropa", slug: "ropa" }]

const product: ProductDTO = {
    id: 1,
    name: "Remera",
    slug: "remera",
    price: 25000,
    stock: 10,
    images: [
        { id: 1, url: "https://example.com/1.jpg" },
        { id: 2, url: "https://example.com/2.jpg" },
    ],
    category: categories[0],
    brand: "Marca",
    isOnline: true,
}

function renderModal(props: Partial<Parameters<typeof ProductModal>[0]> = {}) {
    return render(
        <ProductModal
            categories={categories}
            isOpen={true}
            mode="create"
            onClose={jest.fn()}
            action={mockAction}
            {...props}
        />
    )
}

describe("ProductModal", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders one empty image input by default", () => {
        renderModal()
        expect(screen.getAllByRole("textbox", { name: "URL de imagen" })).toHaveLength(1)
    })

    it("renders existing product images when editing", () => {
        renderModal({ product, mode: "edit" })
        expect(screen.getAllByRole("textbox", { name: "URL de imagen" })).toHaveLength(2)
    })

    it("adds an image input when clicking the add button", async () => {
        renderModal()
        const addButton = screen.getByRole("button", { name: /Agregar imagen/i })
        await act(async () => {
            await userEvent.click(addButton)
        })
        expect(screen.getAllByRole("textbox", { name: "URL de imagen" })).toHaveLength(2)
    })

    it("removes an image input when clicking the remove button", async () => {
        renderModal({ product, mode: "edit" })
        expect(screen.getAllByRole("textbox", { name: "URL de imagen" })).toHaveLength(2)
        const removeButtons = screen.getAllByRole("button", { name: /✕/i })
        await act(async () => {
            await userEvent.click(removeButtons[0])
        })
        expect(screen.getAllByRole("textbox", { name: "URL de imagen" })).toHaveLength(1)
    })

    it("shows an error when submitting with no valid images", async () => {
        renderModal()
        await act(async () => {
            await userEvent.type(screen.getByLabelText(/Nombre/i), "Remera")
            await userEvent.type(screen.getByLabelText(/Precio/i), "25000")
            await userEvent.type(screen.getByLabelText(/Stock/i), "10")
            await userEvent.selectOptions(screen.getByLabelText(/Categoría/i), "1")
        })
        const submitButton = screen.getByRole("button", { name: /Crear/i })
        await act(async () => {
            await userEvent.click(submitButton)
        })
        expect(screen.getByText(/Al menos una imagen es obligatoria/i)).toBeInTheDocument()
        expect(mockAction).not.toHaveBeenCalled()
    })

    it("submits the form when at least one image URL is provided", async () => {
        mockAction.mockResolvedValue({ success: true })
        renderModal()
        await act(async () => {
            await userEvent.type(screen.getByLabelText(/Nombre/i), "Remera")
            await userEvent.type(screen.getByLabelText(/Precio/i), "25000")
            await userEvent.type(screen.getByLabelText(/Stock/i), "10")
            await userEvent.selectOptions(screen.getByLabelText(/Categoría/i), "1")
            await userEvent.type(screen.getByRole("textbox", { name: "URL de imagen" }), "https://example.com/1.jpg")
        })
        const submitButton = screen.getByRole("button", { name: /Crear/i })
        await act(async () => {
            await userEvent.click(submitButton)
        })
        expect(mockAction).toHaveBeenCalledTimes(1)
        const formData = mockAction.mock.calls[0][0] as FormData
        expect(formData.getAll("image")).toEqual(["https://example.com/1.jpg"])
    })
})
