import { productToDTO } from "@/Interfaces/dto/product.dto"
import { Product } from "@/domain/product/entities/product"
import { ProductImage } from "@/domain/product/entities/image"
import { Category } from "@/domain/product/entities/category"

describe("productToDTO", () => {
    const category = new Category({ id: 1, name: "Ropa", slug: "ropa", showInNavbar: false })
    const baseProps = {
        id: 1,
        name: "Remera",
        price: 100,
        costPrice: 50,
        images: [new ProductImage(1, "url", 1)],
        category,
        desc: "Descripción",
        brand: "Marca",
        stock: 10,
        weight: 1,
    }

    describe("measurement fields mapping", () => {
        it("maps size, width, and length when all are present", () => {
            const product = new Product({
                ...baseProps,
                size: "M",
                width: 50.5,
                length: 70.2,
            })

            const dto = productToDTO(product)

            expect(dto.size).toBe("M")
            expect(dto.width).toBe(50.5)
            expect(dto.length).toBe(70.2)
        })

        it("maps null measurements correctly", () => {
            const product = new Product({
                ...baseProps,
                size: null,
                width: null,
                length: null,
            })

            const dto = productToDTO(product)

            expect(dto.size).toBeNull()
            expect(dto.width).toBeNull()
            expect(dto.length).toBeNull()
        })

        it("maps undefined measurements correctly", () => {
            const product = new Product({
                ...baseProps,
                size: undefined,
                width: undefined,
                length: undefined,
            })

            const dto = productToDTO(product)

            expect(dto.size).toBeUndefined()
            expect(dto.width).toBeUndefined()
            expect(dto.length).toBeUndefined()
        })

        it("maps partial measurements correctly", () => {
            const product = new Product({
                ...baseProps,
                size: "L",
                width: null,
                length: undefined,
            })

            const dto = productToDTO(product)

            expect(dto.size).toBe("L")
            expect(dto.width).toBeNull()
            expect(dto.length).toBeUndefined()
        })

        it("maps zero values correctly", () => {
            const product = new Product({
                ...baseProps,
                size: "S",
                width: 0,
                length: 0,
            })

            const dto = productToDTO(product)

            expect(dto.size).toBe("S")
            expect(dto.width).toBe(0)
            expect(dto.length).toBe(0)
        })

        it("preserves all other DTO fields when measurements are present", () => {
            const product = new Product({
                ...baseProps,
                size: "XL",
                width: 45,
                length: 60,
            })

            const dto = productToDTO(product)

            expect(dto.id).toBe(1)
            expect(dto.name).toBe("Remera")
            expect(dto.price).toBe(100)
            expect(dto.stock).toBe(10)
            expect(dto.brand).toBe("Marca")
            expect(dto.category.name).toBe("Ropa")
            expect(dto.images).toHaveLength(1)
            expect(dto.size).toBe("XL")
            expect(dto.width).toBe(45)
            expect(dto.length).toBe(60)
        })
    })
})
