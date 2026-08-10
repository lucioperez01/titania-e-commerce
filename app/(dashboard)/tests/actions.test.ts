const mockCreateProduct = jest.fn()
const mockUpdateProduct = jest.fn()
const mockRevalidatePath = jest.fn()
const mockPrismaProductUpdate = jest.fn()

jest.mock("next/cache", () => ({
    revalidatePath: mockRevalidatePath,
}))

jest.mock("@/application/use-cases/create-product", () => ({
    createProduct: mockCreateProduct,
}))

jest.mock("@/application/use-cases/update-product", () => ({
    updateProduct: mockUpdateProduct,
}))

jest.mock("@/infrastructure/db/prismaClient", () => ({
    prisma: {
        product: {
            update: mockPrismaProductUpdate,
        },
    },
}))

import { createProductAction, updateProductAction, toggleProductOnlineAction } from "@/app/(dashboard)/actions"

describe("dashboard actions", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    function buildProductFormData(images: string[], overrides?: Record<string, string>): FormData {
        const formData = new FormData()
        formData.set("name", "Remera")
        formData.set("price", "25000")
        formData.set("stock", "10")
        formData.set("categoryId", "1")
        formData.set("brand", "Marca")
        formData.set("description", "Descripción")
        images.forEach((url) => formData.append("image", url))
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => formData.set(key, value))
        }
        return formData
    }

    describe("createProductAction", () => {
        it("parses multiple image inputs and passes them to createProduct", async () => {
            const formData = buildProductFormData([
                "https://example.com/1.jpg",
                "",
                "https://example.com/2.jpg",
                "  ",
                "https://example.com/3.jpg",
            ])

            const result = await createProductAction(formData)

            expect(result.success).toBe(true)
            expect(mockCreateProduct).toHaveBeenCalledTimes(1)
            const input = mockCreateProduct.mock.calls[0][0]
            expect(input.images).toEqual([
                "https://example.com/1.jpg",
                "https://example.com/2.jpg",
                "https://example.com/3.jpg",
            ])
            expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/products")
        })

        it("returns an error when no valid images are provided", async () => {
            const formData = buildProductFormData(["", "  "])

            const result = await createProductAction(formData)

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/imagen/i)
            expect(mockCreateProduct).not.toHaveBeenCalled()
        })
    })

    describe("updateProductAction", () => {
        it("parses multiple image inputs and passes them to updateProduct", async () => {
            const formData = new FormData()
            formData.set("id", "1")
            formData.set("name", "Remera Premium")
            formData.append("image", "https://example.com/a.jpg")
            formData.append("image", "https://example.com/b.jpg")

            const result = await updateProductAction(formData)

            expect(result.success).toBe(true)
            expect(mockUpdateProduct).toHaveBeenCalledTimes(1)
            const input = mockUpdateProduct.mock.calls[0][0]
            expect(input.images).toEqual(["https://example.com/a.jpg", "https://example.com/b.jpg"])
            expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/products")
        })
    })

    describe("toggleProductOnlineAction", () => {
        it("updates the product isOnline flag and revalidates", async () => {
            mockPrismaProductUpdate.mockResolvedValue({ id: 1, isOnline: false })

            const result = await toggleProductOnlineAction(1, false)

            expect(result.success).toBe(true)
            expect(mockPrismaProductUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isOnline: false },
            })
            expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/products")
        })

        it("returns an error when the update fails", async () => {
            mockPrismaProductUpdate.mockRejectedValue(new Error("DB error"))

            const result = await toggleProductOnlineAction(2, true)

            expect(result.success).toBe(false)
            expect(result.error).toBe("DB error")
        })
    })
})
