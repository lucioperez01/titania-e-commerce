import { Product } from "@/domain/product/entities/product"
import { ProductImage } from "@/domain/product/entities/image"
import { Category } from "@/domain/product/entities/category"

describe("Product entity", () => {
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

    describe("size validation", () => {
        it("accepts size with 50 characters or less", () => {
            const product = new Product({ ...baseProps, size: "M" })
            expect(product.size).toBe("M")
        })

        it("accepts size with exactly 50 characters", () => {
            const size50 = "a".repeat(50)
            const product = new Product({ ...baseProps, size: size50 })
            expect(product.size).toBe(size50)
        })

        it("rejects size with more than 50 characters", () => {
            const size51 = "a".repeat(51)
            expect(() => new Product({ ...baseProps, size: size51 })).toThrow(
                "El talle debe tener 50 caracteres o menos."
            )
        })

        it("accepts null size", () => {
            const product = new Product({ ...baseProps, size: null })
            expect(product.size).toBeNull()
        })

        it("accepts undefined size", () => {
            const product = new Product({ ...baseProps, size: undefined })
            expect(product.size).toBeUndefined()
        })
    })

    describe("width validation", () => {
        it("accepts positive width", () => {
            const product = new Product({ ...baseProps, width: 50.5 })
            expect(product.width).toBe(50.5)
        })

        it("accepts zero width", () => {
            const product = new Product({ ...baseProps, width: 0 })
            expect(product.width).toBe(0)
        })

        it("rejects negative width", () => {
            expect(() => new Product({ ...baseProps, width: -5 })).toThrow(
                "El ancho no puede ser negativo."
            )
        })

        it("accepts null width", () => {
            const product = new Product({ ...baseProps, width: null })
            expect(product.width).toBeNull()
        })

        it("accepts undefined width", () => {
            const product = new Product({ ...baseProps, width: undefined })
            expect(product.width).toBeUndefined()
        })
    })

    describe("length validation", () => {
        it("accepts positive length", () => {
            const product = new Product({ ...baseProps, length: 70.2 })
            expect(product.length).toBe(70.2)
        })

        it("accepts zero length", () => {
            const product = new Product({ ...baseProps, length: 0 })
            expect(product.length).toBe(0)
        })

        it("rejects negative length", () => {
            expect(() => new Product({ ...baseProps, length: -10 })).toThrow(
                "El largo no puede ser negativo."
            )
        })

        it("accepts null length", () => {
            const product = new Product({ ...baseProps, length: null })
            expect(product.length).toBeNull()
        })

        it("accepts undefined length", () => {
            const product = new Product({ ...baseProps, length: undefined })
            expect(product.length).toBeUndefined()
        })
    })

    describe("combined measurements", () => {
        it("accepts all measurements together", () => {
            const product = new Product({
                ...baseProps,
                size: "L",
                width: 45.5,
                length: 60,
            })
            expect(product.size).toBe("L")
            expect(product.width).toBe(45.5)
            expect(product.length).toBe(60)
        })

        it("accepts partial measurements", () => {
            const product = new Product({
                ...baseProps,
                size: "M",
                width: null,
                length: undefined,
            })
            expect(product.size).toBe("M")
            expect(product.width).toBeNull()
            expect(product.length).toBeUndefined()
        })
    })
})
