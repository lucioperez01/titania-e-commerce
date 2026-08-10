import { Category } from "@/domain/product/entities/category"

const mockAddCategory = jest.fn()
const mockUpdateCategory = jest.fn()
const mockDeleteCategory = jest.fn()
const mockFindAllCategories = jest.fn()
const mockFindCategoryById = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaCategoryRepository", () => ({
    PrismaCategoriesRepository: jest.fn().mockImplementation(() => ({
        addCategory: mockAddCategory,
        updateCategory: mockUpdateCategory,
        deleteCategory: mockDeleteCategory,
        findAll: mockFindAllCategories,
        findById: mockFindCategoryById,
    })),
}))

import { createCategory, CreateCategoryInput } from "@/application/use-cases/create-category"
import { updateCategory, UpdateCategoryInput } from "@/application/use-cases/update-category"
import { deleteCategory } from "@/application/use-cases/delete-category"

describe("category use cases", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe("createCategory", () => {
        it("creates a category with valid name and generates a slug", async () => {
            mockFindAllCategories.mockResolvedValue([])

            const input: CreateCategoryInput = { name: "Electrónica" }

            await createCategory(input)

            expect(mockFindAllCategories).toHaveBeenCalled()
            expect(mockAddCategory).toHaveBeenCalledTimes(1)
            const created = mockAddCategory.mock.calls[0][0]
            expect(created).toBeInstanceOf(Category)
            expect(created.name).toBe("Electrónica")
            expect(created.slug).toBe("electronica")
        })

        it("rejects a duplicate category name", async () => {
            mockFindAllCategories.mockResolvedValue([{ id: 1, name: "Electrónica", slug: "electronica" }])

            await expect(createCategory({ name: "Electrónica" })).rejects.toThrow(/Ya existe/)
            expect(mockAddCategory).not.toHaveBeenCalled()
        })

        it("rejects an empty name", async () => {
            mockFindAllCategories.mockResolvedValue([])

            await expect(createCategory({ name: "" })).rejects.toThrow(/nombre/)
            expect(mockAddCategory).not.toHaveBeenCalled()
        })
    })

    describe("updateCategory", () => {
        it("updates a category name", async () => {
            const existing = new Category({ id: 1, name: "Electrónica" })
            mockFindCategoryById.mockResolvedValue(existing)

            const input: UpdateCategoryInput = { id: 1, name: "Electrónicos" }

            await updateCategory(input)

            expect(mockFindCategoryById).toHaveBeenCalledWith(1)
            expect(mockUpdateCategory).toHaveBeenCalledTimes(1)
            const updated = mockUpdateCategory.mock.calls[0][0]
            expect(updated).toBeInstanceOf(Category)
            expect(updated.name).toBe("Electrónicos")
            expect(updated.slug).toBe("electronicos")
        })

        it("throws when the category does not exist", async () => {
            mockFindCategoryById.mockResolvedValue(null)

            await expect(updateCategory({ id: 99, name: "X" })).rejects.toThrow(/Categoría/)
            expect(mockUpdateCategory).not.toHaveBeenCalled()
        })
    })

    describe("deleteCategory", () => {
        it("deletes a category by id", async () => {
            await deleteCategory(1)

            expect(mockDeleteCategory).toHaveBeenCalledWith(1)
        })
    })
})
