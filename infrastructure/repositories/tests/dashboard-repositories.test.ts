const mockProductUpdate = jest.fn()
const mockOrderUpdate = jest.fn()

jest.mock("@/infrastructure/db/prismaClient", () => ({
    prisma: {
        product: {
            update: mockProductUpdate,
        },
        order: {
            update: mockOrderUpdate,
        },
    },
}))

import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import { PrismaOrderRepository } from "@/infrastructure/repositories/PrismaOrderRepository"
import { Product } from "@/domain/product/entities/product"
import { Category } from "@/domain/product/entities/category"
import { ProductImage } from "@/domain/product/entities/image"
import { Order } from "@/domain/order/entities/Order"
import { OrderStatus } from "@/domain/order/entities/OrderStatus"
import { PaymentProvider } from "@/domain/order/entities/PaymentProvider"

describe("PrismaProductRepository.updateProduct", () => {
    it("includes where: { id } in the prisma update call", async () => {
        mockProductUpdate.mockResolvedValue({})
        const repository = new PrismaProductRepository()
        const category = new Category({ id: 1, name: "Ropa", image: "img.png" })
        const product = new Product({
            id: 7,
            name: "Remera",
            slug: "remera",
            price: 100,
            costPrice: 100,
            stock: 5,
            weight: 1,
            images: [new ProductImage(1, "url", 7)],
            category,
            desc: "Desc",
            brand: "Marca",
        })

        await repository.updateProduct(product)

        expect(mockProductUpdate).toHaveBeenCalledTimes(1)
        const args = mockProductUpdate.mock.calls[0][0]
        expect(args.where).toEqual({ id: 7 })
        expect(args.data).toBeDefined()
    })
})

describe("PrismaOrderRepository.updateOrder", () => {
    it("passes a single object with where and data to prisma.order.update", async () => {
        mockOrderUpdate.mockResolvedValue({})
        const repository = new PrismaOrderRepository()
        const now = new Date()
        const order = new Order(
            3,
            null,
            "email@example.com",
            "Name",
            "123",
            100,
            110,
            OrderStatus.PENDING,
            null,
            null,
            null,
            PaymentProvider.MERCADOPAGO,
            null,
            null,
            1,
            now,
            now,
        )

        await repository.updateOrder(order)

        expect(mockOrderUpdate).toHaveBeenCalledTimes(1)
        const args = mockOrderUpdate.mock.calls[0][0]
        expect(args.where).toEqual({ id: 3 })
        expect(args.data).toBeDefined()
    })
})
