import { Category } from "@/domain/product/entities/category"
import { ProductImage } from "@/domain/product/entities/image"

const mockAddProduct = jest.fn()
const mockUpdateProduct = jest.fn()
const mockDeleteProduct = jest.fn()
const mockFindProductById = jest.fn()
const mockFindAllProducts = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaProductRepository", () => ({
    PrismaProductRepository: jest.fn().mockImplementation(() => ({
        addProduct: mockAddProduct,
        updateProduct: mockUpdateProduct,
        deleteProduct: mockDeleteProduct,
        findById: mockFindProductById,
        findAll: mockFindAllProducts,
    })),
}))

const mockFindCategoryById = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaCategoryRepository", () => ({
    PrismaCategoriesRepository: jest.fn().mockImplementation(() => ({
        findById: mockFindCategoryById,
    })),
}))

import { createProduct, CreateProductInput } from "@/application/use-cases/create-product"
import { updateProduct, UpdateProductInput } from "@/application/use-cases/update-product"
import { deleteProduct } from "@/application/use-cases/delete-product"
import { getProducts } from "@/application/use-cases/get-products"

describe("product use cases", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const category: Category = { id: 1, name: "Ropa", slug: "ropa", showInNavbar: false }

    describe("createProduct", () => {
        it("creates a product with multiple images and generates a slug", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            const input: CreateProductInput = {
                name: "Remera",
                price: 25000,
                stock: 10,
                categoryId: 1,
                brand: "Marca",
                description: "Descripción",
                images: ["https://example.com/1.jpg", "https://example.com/2.jpg", "https://example.com/3.jpg"],
            }

            await createProduct(input)

            expect(mockFindCategoryById).toHaveBeenCalledWith(1)
            expect(mockAddProduct).toHaveBeenCalledTimes(1)
            const created = mockAddProduct.mock.calls[0][0]
            expect(created.name).toBe("Remera")
            expect(created.slug).toBe("remera")
            expect(created.price).toBe(25000)
            expect(created.stock).toBe(10)
            expect(created.category).toEqual(category)
            expect(created.images).toHaveLength(3)
            expect(created.images[0]).toBeInstanceOf(ProductImage)
            expect(created.images[0].url).toBe("https://example.com/1.jpg")
            expect(created.images[1].url).toBe("https://example.com/2.jpg")
            expect(created.images[2].url).toBe("https://example.com/3.jpg")
        })

        it("creates a product with a single image for backward compatibility", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await createProduct({
                name: "Remera",
                price: 100,
                stock: 1,
                categoryId: 1,
                images: ["https://example.com/single.jpg"],
            })

            const created = mockAddProduct.mock.calls[0][0]
            expect(created.images).toHaveLength(1)
            expect(created.images[0].url).toBe("https://example.com/single.jpg")
        })

        it("rejects when no images are provided", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await expect(
                createProduct({ name: "Remera", price: 100, stock: 1, categoryId: 1, images: [] })
            ).rejects.toThrow(/imagen/)

            expect(mockAddProduct).not.toHaveBeenCalled()
        })

        it("rejects an empty name", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await expect(
                createProduct({ name: "", price: 100, stock: 1, categoryId: 1, images: ["https://example.com/1.jpg"] })
            ).rejects.toThrow(/nombre/)

            expect(mockAddProduct).not.toHaveBeenCalled()
        })

        it("rejects a negative price", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await expect(
                createProduct({ name: "Remera", price: -100, stock: 1, categoryId: 1, images: ["https://example.com/1.jpg"] })
            ).rejects.toThrow(/precio/)

            expect(mockAddProduct).not.toHaveBeenCalled()
        })

        it("generates a slug from a multi-word name", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await createProduct({
                name: "Remera de Prueba",
                price: 100,
                stock: 1,
                categoryId: 1,
                images: ["https://example.com/1.jpg"],
            })

            expect(mockAddProduct.mock.calls[0][0].slug).toBe("remera-de-prueba")
        })

        it("throws when the category does not exist", async () => {
            mockFindCategoryById.mockResolvedValue(null)

            await expect(
                createProduct({ name: "Remera", price: 100, stock: 1, categoryId: 99, images: ["https://example.com/1.jpg"] })
            ).rejects.toThrow(/categoría/)
        })
    })

    describe("updateProduct", () => {
        it("updates a product name and price", async () => {
            const existing = {
                id: 1,
                name: "Remera",
                slug: "remera",
                price: 25000,
                costPrice: 25000,
                stock: 10,
                weight: 1,
                images: [new ProductImage(1, "url", 1)],
                category,
                desc: "Descripción",
                brand: "Marca",
            }
            mockFindProductById.mockResolvedValue(existing)

            const input: UpdateProductInput = { id: 1, name: "Remera Premium", price: 30000 }

            await updateProduct(input)

            expect(mockFindProductById).toHaveBeenCalledWith(1)
            expect(mockUpdateProduct).toHaveBeenCalledTimes(1)
            const updated = mockUpdateProduct.mock.calls[0][0]
            expect(updated.name).toBe("Remera Premium")
            expect(updated.slug).toBe("remera-premium")
            expect(updated.price).toBe(30000)
            expect(updated.stock).toBe(10)
        })

        it("replaces images when new images are provided", async () => {
            const existing = {
                id: 1,
                name: "Remera",
                slug: "remera",
                price: 25000,
                costPrice: 25000,
                stock: 10,
                weight: 1,
                images: [new ProductImage(1, "old-url", 1)],
                category,
                desc: "Descripción",
                brand: "Marca",
            }
            mockFindProductById.mockResolvedValue(existing)

            const input: UpdateProductInput = {
                id: 1,
                images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
            }

            await updateProduct(input)

            const updated = mockUpdateProduct.mock.calls[0][0]
            expect(updated.images).toHaveLength(2)
            expect(updated.images[0]).toBeInstanceOf(ProductImage)
            expect(updated.images[0].url).toBe("https://example.com/a.jpg")
            expect(updated.images[1].url).toBe("https://example.com/b.jpg")
        })

        it("keeps existing images when images are not provided", async () => {
            const existing = {
                id: 1,
                name: "Remera",
                slug: "remera",
                price: 25000,
                costPrice: 25000,
                stock: 10,
                weight: 1,
                images: [new ProductImage(1, "existing-url", 1)],
                category,
                desc: "Descripción",
                brand: "Marca",
            }
            mockFindProductById.mockResolvedValue(existing)

            const input: UpdateProductInput = { id: 1, name: "Remera Premium" }

            await updateProduct(input)

            const updated = mockUpdateProduct.mock.calls[0][0]
            expect(updated.images).toHaveLength(1)
            expect(updated.images[0].url).toBe("existing-url")
        })

        it("throws when the product does not exist", async () => {
            mockFindProductById.mockResolvedValue(null)

            await expect(updateProduct({ id: 99, name: "X" })).rejects.toThrow(/Producto/)
            expect(mockUpdateProduct).not.toHaveBeenCalled()
        })
    })

    describe("getProducts", () => {
        it("filters online products when onlyOnline is true", async () => {
            mockFindAllProducts.mockResolvedValue([])

            await getProducts({ onlyOnline: true })

            expect(mockFindAllProducts).toHaveBeenCalledWith({ isOnline: true })
        })

        it("returns all products when onlyOnline is not provided", async () => {
            mockFindAllProducts.mockResolvedValue([])

            await getProducts()

            expect(mockFindAllProducts).toHaveBeenCalledWith({ categoryId: undefined })
        })
    })

    describe("deleteProduct", () => {
        it("deletes a product by id", async () => {
            await deleteProduct(1)

            expect(mockDeleteProduct).toHaveBeenCalledWith(1)
        })
    })

    describe("createProduct with measurements", () => {
        it("passes size, width, and length to Product entity", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            const input: CreateProductInput = {
                name: "Remera",
                price: 25000,
                stock: 10,
                categoryId: 1,
                images: ["https://example.com/1.jpg"],
                size: "M",
                width: 50.5,
                length: 70.2,
            }

            await createProduct(input)

            expect(mockAddProduct).toHaveBeenCalledTimes(1)
            const created = mockAddProduct.mock.calls[0][0]
            expect(created.size).toBe("M")
            expect(created.width).toBe(50.5)
            expect(created.length).toBe(70.2)
        })

        it("passes null measurements to Product entity", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            const input: CreateProductInput = {
                name: "Remera",
                price: 25000,
                stock: 10,
                categoryId: 1,
                images: ["https://example.com/1.jpg"],
                size: null,
                width: null,
                length: null,
            }

            await createProduct(input)

            const created = mockAddProduct.mock.calls[0][0]
            expect(created.size).toBeNull()
            expect(created.width).toBeNull()
            expect(created.length).toBeNull()
        })

        it("rejects negative width", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await expect(
                createProduct({
                    name: "Remera",
                    price: 100,
                    stock: 1,
                    categoryId: 1,
                    images: ["https://example.com/1.jpg"],
                    width: -5,
                })
            ).rejects.toThrow(/ancho.*negativo/i)

            expect(mockAddProduct).not.toHaveBeenCalled()
        })

        it("rejects negative length", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await expect(
                createProduct({
                    name: "Remera",
                    price: 100,
                    stock: 1,
                    categoryId: 1,
                    images: ["https://example.com/1.jpg"],
                    length: -10,
                })
            ).rejects.toThrow(/largo.*negativo/i)

            expect(mockAddProduct).not.toHaveBeenCalled()
        })

        it("rejects size longer than 50 characters", async () => {
            mockFindCategoryById.mockResolvedValue(category)

            await expect(
                createProduct({
                    name: "Remera",
                    price: 100,
                    stock: 1,
                    categoryId: 1,
                    images: ["https://example.com/1.jpg"],
                    size: "a".repeat(51),
                })
            ).rejects.toThrow(/talle.*50 caracteres/i)

            expect(mockAddProduct).not.toHaveBeenCalled()
        })
    })

    describe("updateProduct with measurements", () => {
        it("passes size, width, and length to Product entity", async () => {
            const existing = {
                id: 1,
                name: "Remera",
                slug: "remera",
                price: 25000,
                costPrice: 25000,
                stock: 10,
                weight: 1,
                images: [new ProductImage(1, "url", 1)],
                category,
                desc: "Descripción",
                brand: "Marca",
                size: "S",
                width: 40,
                length: 60,
            }
            mockFindProductById.mockResolvedValue(existing)

            const input: UpdateProductInput = {
                id: 1,
                size: "L",
                width: 50.5,
                length: 70.2,
            }

            await updateProduct(input)

            const updated = mockUpdateProduct.mock.calls[0][0]
            expect(updated.size).toBe("L")
            expect(updated.width).toBe(50.5)
            expect(updated.length).toBe(70.2)
        })

        it("clears measurements when set to null", async () => {
            const existing = {
                id: 1,
                name: "Remera",
                slug: "remera",
                price: 25000,
                costPrice: 25000,
                stock: 10,
                weight: 1,
                images: [new ProductImage(1, "url", 1)],
                category,
                desc: "Descripción",
                brand: "Marca",
                size: "M",
                width: 50,
                length: 70,
            }
            mockFindProductById.mockResolvedValue(existing)

            const input: UpdateProductInput = {
                id: 1,
                size: null,
                width: null,
                length: null,
            }

            await updateProduct(input)

            const updated = mockUpdateProduct.mock.calls[0][0]
            expect(updated.size).toBeNull()
            expect(updated.width).toBeNull()
            expect(updated.length).toBeNull()
        })
    })

    describe("getProducts with size filter", () => {
        it("passes sizes filter to repository", async () => {
            mockFindAllProducts.mockResolvedValue([])

            await getProducts({ sizes: ["M", "L"] })

            expect(mockFindAllProducts).toHaveBeenCalledWith({
                categoryId: undefined,
                sizes: ["M", "L"],
            })
        })

        it("passes sizes filter with onlyOnline option", async () => {
            mockFindAllProducts.mockResolvedValue([])

            await getProducts({ onlyOnline: true, sizes: ["S"] })

            expect(mockFindAllProducts).toHaveBeenCalledWith({
                isOnline: true,
                categoryId: undefined,
                sizes: ["S"],
            })
        })

        it("does not pass sizes when not provided", async () => {
            mockFindAllProducts.mockResolvedValue([])

            await getProducts({ onlyOnline: true })

            expect(mockFindAllProducts).toHaveBeenCalledWith({
                isOnline: true,
            })
        })
    })
})
