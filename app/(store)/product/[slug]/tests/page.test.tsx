/** @jest-environment jsdom */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import ProductPage from "@/app/(store)/product/[slug]/page"
import { ProductDTO } from "@/Interfaces/dto/product.dto"

// Mock dependencies
jest.mock("@/application/use-cases/get-products", () => ({
    getProducts: jest.fn(),
}))

jest.mock("next/link", () => ({
    __esModule: true,
    default: function Link({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>
    },
}))

jest.mock("@/components/product/rating", () => ({
    Rating: function Rating({ value }: { value: number }) {
        return <div data-testid="rating">{value}</div>
    },
}))

jest.mock("@/components/product/price", () => ({
    __esModule: true,
    default: function Price({ value, oldValue }: { value: number; oldValue: number }) {
        return (
            <div data-testid="price">
                {value} {oldValue > 0 && <span>{oldValue}</span>}
            </div>
        )
    },
}))

jest.mock("@/components/cart/add-to-cart-button", () => ({
    __esModule: true,
    default: function AddToCartButton({ productId, stock }: { productId: number; stock: number }) {
        return (
            <button data-testid="add-to-cart" data-product-id={productId} data-stock={stock}>
                Add to Cart
            </button>
        )
    },
}))

jest.mock("@/components/wishlist/wishlist-button", () => ({
    __esModule: true,
    default: function WishlistButton({ productId }: { productId: number }) {
        return (
            <button data-testid="wishlist" data-product-id={productId}>
                Wishlist
            </button>
        )
    },
}))

jest.mock("@/components/ui/button", () => ({
    Button: function Button({ children, ...props }: { children: React.ReactNode }) {
        return <button {...props}>{children}</button>
    },
}))

jest.mock("@/components/product/productImageCarousel", () => ({
    __esModule: true,
    default: function ProductImageCarousel({ img }: { img: string[] }) {
        return <div data-testid="carousel">{img.length} images</div>
    },
}))

jest.mock("lucide-react", () => ({
    LucideCheck: function LucideCheck() {
        return <div data-testid="check-icon" />
    },
    LucideTruck: function LucideTruck() {
        return <div data-testid="truck-icon" />
    },
}))

import { getProducts } from "@/application/use-cases/get-products"

const mockGetProducts = getProducts as jest.MockedFunction<typeof getProducts>

describe("ProductPage", () => {
    const baseProduct: ProductDTO = {
        id: 1,
        name: "Remera",
        slug: "remera",
        price: 25000,
        images: [{ id: 1, url: "/remera.jpg" }],
        category: { id: 1, name: "Ropa", slug: "ropa" },
        brand: "Marca",
        stock: 10,
        isOnline: true,
        desc: "Descripción",
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe("measurements section", () => {
        it("shows measurements section when product has all measurements", async () => {
            const productWithMeasurements: ProductDTO = {
                ...baseProduct,
                size: "M",
                width: 50,
                length: 70,
            }
            mockGetProducts.mockResolvedValue([productWithMeasurements])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            expect(screen.getByText(/Talle: M/)).toBeInTheDocument()
            expect(screen.getByText(/Ancho: 50cm/)).toBeInTheDocument()
            expect(screen.getByText(/Largo: 70cm/)).toBeInTheDocument()
        })

        it("shows measurements section when product has only size", async () => {
            const productWithSize: ProductDTO = {
                ...baseProduct,
                size: "L",
                width: null,
                length: null,
            }
            mockGetProducts.mockResolvedValue([productWithSize])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            expect(screen.getByText(/Talle: L/)).toBeInTheDocument()
            expect(screen.queryByText(/Ancho:/)).not.toBeInTheDocument()
            expect(screen.queryByText(/Largo:/)).not.toBeInTheDocument()
        })

        it("shows measurements section when product has only dimensions", async () => {
            const productWithDimensions: ProductDTO = {
                ...baseProduct,
                size: null,
                width: 45.5,
                length: 60,
            }
            mockGetProducts.mockResolvedValue([productWithDimensions])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            expect(screen.queryByText(/Talle:/)).not.toBeInTheDocument()
            expect(screen.getByText(/Ancho: 45.5cm/)).toBeInTheDocument()
            expect(screen.getByText(/Largo: 60cm/)).toBeInTheDocument()
        })

        it("does not show measurements section when all measurements are null", async () => {
            const productWithoutMeasurements: ProductDTO = {
                ...baseProduct,
                size: null,
                width: null,
                length: null,
            }
            mockGetProducts.mockResolvedValue([productWithoutMeasurements])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            expect(screen.queryByText(/Talle:/)).not.toBeInTheDocument()
            expect(screen.queryByText(/Ancho:/)).not.toBeInTheDocument()
            expect(screen.queryByText(/Largo:/)).not.toBeInTheDocument()
        })

        it("does not show measurements section when measurements are undefined", async () => {
            const productWithUndefinedMeasurements: ProductDTO = {
                ...baseProduct,
                size: undefined,
                width: undefined,
                length: undefined,
            }
            mockGetProducts.mockResolvedValue([productWithUndefinedMeasurements])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            expect(screen.queryByText(/Talle:/)).not.toBeInTheDocument()
            expect(screen.queryByText(/Ancho:/)).not.toBeInTheDocument()
            expect(screen.queryByText(/Largo:/)).not.toBeInTheDocument()
        })

        it("shows measurements with decimal values", async () => {
            const productWithDecimals: ProductDTO = {
                ...baseProduct,
                size: "XL",
                width: 50.5,
                length: 70.2,
            }
            mockGetProducts.mockResolvedValue([productWithDecimals])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            expect(screen.getByText(/Talle: XL/)).toBeInTheDocument()
            expect(screen.getByText(/Ancho: 50.5cm/)).toBeInTheDocument()
            expect(screen.getByText(/Largo: 70.2cm/)).toBeInTheDocument()
        })

        it("shows measurements with pipe separators between present fields", async () => {
            const productWithPartialMeasurements: ProductDTO = {
                ...baseProduct,
                size: "M",
                width: 50,
                length: null,
            }
            mockGetProducts.mockResolvedValue([productWithPartialMeasurements])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            // Check that the measurements text contains the pipe separator
            const measurementsText = screen.getByText(/Talle: M/)
            expect(measurementsText).toHaveTextContent(/Talle: M.*\|.*Ancho: 50cm/)
            expect(measurementsText).not.toHaveTextContent(/Largo:/)
        })

        it("shows custom size value", async () => {
            const productWithCustomSize: ProductDTO = {
                ...baseProduct,
                size: "Custom Fit",
                width: null,
                length: null,
            }
            mockGetProducts.mockResolvedValue([productWithCustomSize])

            const page = await ProductPage({ params: Promise.resolve({ slug: "remera" }) })
            render(page)

            expect(screen.getByText(/Talle: Custom Fit/)).toBeInTheDocument()
        })
    })

    describe("product not found", () => {
        it("shows not found message when product does not exist", async () => {
            mockGetProducts.mockResolvedValue([])

            const page = await ProductPage({ params: Promise.resolve({ slug: "nonexistent" }) })
            render(page)

            expect(screen.getByText(/Producto no encontrado/)).toBeInTheDocument()
        })
    })
})
