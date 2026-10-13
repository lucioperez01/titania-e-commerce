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

    describe("createProductAction with measurements", () => {
        it("parses size, width, and length from FormData", async () => {
            const formData = buildProductFormData(["https://example.com/1.jpg"], {
                size: "M",
                width: "50.5",
                length: "70.2",
            })

            const result = await createProductAction(formData)

            expect(result.success).toBe(true)
            expect(mockCreateProduct).toHaveBeenCalledTimes(1)
            const input = mockCreateProduct.mock.calls[0][0]
            expect(input.size).toBe("M")
            expect(input.width).toBe(50.5)
            expect(input.length).toBe(70.2)
        })

        it("parses empty measurements as null", async () => {
            const formData = buildProductFormData(["https://example.com/1.jpg"], {
                size: "",
                width: "",
                length: "",
            })

            const result = await createProductAction(formData)

            expect(result.success).toBe(true)
            const input = mockCreateProduct.mock.calls[0][0]
            expect(input.size).toBeNull()
            expect(input.width).toBeNull()
            expect(input.length).toBeNull()
        })

        it("rejects size longer than 50 characters", async () => {
            const formData = buildProductFormData(["https://example.com/1.jpg"], {
                size: "a".repeat(51),
            })

            const result = await createProductAction(formData)

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/talle.*50 caracteres/i)
            expect(mockCreateProduct).not.toHaveBeenCalled()
        })

        it("rejects negative width", async () => {
            const formData = buildProductFormData(["https://example.com/1.jpg"], {
                width: "-5",
            })

            const result = await createProductAction(formData)

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/ancho.*negativo/i)
            expect(mockCreateProduct).not.toHaveBeenCalled()
        })

        it("rejects negative length", async () => {
            const formData = buildProductFormData(["https://example.com/1.jpg"], {
                length: "-10",
            })

            const result = await createProductAction(formData)

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/largo.*negativo/i)
            expect(mockCreateProduct).not.toHaveBeenCalled()
        })

        it("accepts zero values for width and length", async () => {
            const formData = buildProductFormData(["https://example.com/1.jpg"], {
                width: "0",
                length: "0",
            })

            const result = await createProductAction(formData)

            expect(result.success).toBe(true)
            const input = mockCreateProduct.mock.calls[0][0]
            expect(input.width).toBe(0)
            expect(input.length).toBe(0)
        })
    })

    describe("updateProductAction with measurements", () => {
        it("parses size, width, and length from FormData", async () => {
            const formData = new FormData()
            formData.set("id", "1")
            formData.set("name", "Remera")
            formData.set("size", "L")
            formData.set("width", "45.5")
            formData.set("length", "60")

            const result = await updateProductAction(formData)

            expect(result.success).toBe(true)
            expect(mockUpdateProduct).toHaveBeenCalledTimes(1)
            const input = mockUpdateProduct.mock.calls[0][0]
            expect(input.size).toBe("L")
            expect(input.width).toBe(45.5)
            expect(input.length).toBe(60)
        })

        it("parses empty measurements as null", async () => {
            const formData = new FormData()
            formData.set("id", "1")
            formData.set("name", "Remera")
            formData.set("size", "")
            formData.set("width", "")
            formData.set("length", "")

            const result = await updateProductAction(formData)

            expect(result.success).toBe(true)
            const input = mockUpdateProduct.mock.calls[0][0]
            expect(input.size).toBeNull()
            expect(input.width).toBeNull()
            expect(input.length).toBeNull()
        })

        it("rejects size longer than 50 characters", async () => {
            const formData = new FormData()
            formData.set("id", "1")
            formData.set("name", "Remera")
            formData.set("size", "a".repeat(51))

            const result = await updateProductAction(formData)

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/talle.*50 caracteres/i)
            expect(mockUpdateProduct).not.toHaveBeenCalled()
        })

        it("rejects negative width", async () => {
            const formData = new FormData()
            formData.set("id", "1")
            formData.set("name", "Remera")
            formData.set("width", "-5")

            const result = await updateProductAction(formData)

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/ancho.*negativo/i)
            expect(mockUpdateProduct).not.toHaveBeenCalled()
        })

        it("rejects negative length", async () => {
            const formData = new FormData()
            formData.set("id", "1")
            formData.set("name", "Remera")
            formData.set("length", "-10")

            const result = await updateProductAction(formData)

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/largo.*negativo/i)
            expect(mockUpdateProduct).not.toHaveBeenCalled()
        })
    })
})
