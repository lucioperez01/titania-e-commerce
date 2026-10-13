import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import { Product } from "@/domain/product/entities/product"
import { ProductImage } from "@/domain/product/entities/image"
import { Category } from "@/domain/product/entities/category"

// Mock prisma client
jest.mock("@/infrastructure/db/prismaClient", () => ({
    prisma: {
        product: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}))

import { prisma } from "@/infrastructure/db/prismaClient"

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("PrismaProductRepository", () => {
    let repo: PrismaProductRepository

    beforeEach(() => {
        jest.clearAllMocks()
        repo = new PrismaProductRepository()
    })

    const category = { id: 1, name: "Ropa", slug: "ropa", showInNavbar: false }

    describe("mapToProduct (Prisma → Domain)", () => {
        it("maps size, width, and length from Prisma data", () => {
            const prismaData = {
                id: 1,
                name: "Remera",
                slug: "remera",
                description: "Descripción",
                price: 100,
                costPrice: 50,
                stock: 10,
                weight: 1,
                brand: "Marca",
                isOnline: true,
                size: "M",
                width: 50.5,
                length: 70.2,
                images: [{ id: 1, url: "url" }],
                category,
            }

            // Access private method via any cast for testing
            const product = (repo as any).mapToProduct(prismaData)

            expect(product.size).toBe("M")
            expect(product.width).toBe(50.5)
            expect(product.length).toBe(70.2)
        })

        it("maps null measurements from Prisma data", () => {
            const prismaData = {
                id: 1,
                name: "Remera",
                slug: "remera",
                description: "Descripción",
                price: 100,
                costPrice: 50,
                stock: 10,
                weight: 1,
                brand: "Marca",
                isOnline: true,
                size: null,
                width: null,
                length: null,
                images: [{ id: 1, url: "url" }],
                category,
            }

            const product = (repo as any).mapToProduct(prismaData)

            expect(product.size).toBeUndefined()
            expect(product.width).toBeUndefined()
            expect(product.length).toBeUndefined()
        })

        it("maps undefined measurements from Prisma data", () => {
            const prismaData = {
                id: 1,
                name: "Remera",
                slug: "remera",
                description: "Descripción",
                price: 100,
                costPrice: 50,
                stock: 10,
                weight: 1,
                brand: "Marca",
                isOnline: true,
                images: [{ id: 1, url: "url" }],
                category,
            }

            const product = (repo as any).mapToProduct(prismaData)

            expect(product.size).toBeUndefined()
            expect(product.width).toBeUndefined()
            expect(product.length).toBeUndefined()
        })
    })

    describe("mapToEntity (Domain → Prisma for create)", () => {
        it("maps size, width, and length to Prisma data", () => {
            const product = new Product({
                id: 1,
                name: "Remera",
                price: 100,
                costPrice: 50,
                images: [new ProductImage(1, "url", 1)],
                category: new Category({ id: 1, name: "Ropa", slug: "ropa", showInNavbar: false }),
                desc: "Descripción",
                brand: "Marca",
                stock: 10,
                weight: 1,
                size: "L",
                width: 45.5,
                length: 60,
            })

            const entityData = (repo as any).mapToEntity(product)

            expect(entityData.size).toBe("L")
            expect(entityData.width).toBe(45.5)
            expect(entityData.length).toBe(60)
        })

        it("maps null measurements to null in Prisma data", () => {
            const product = new Product({
                id: 1,
                name: "Remera",
                price: 100,
                costPrice: 50,
                images: [new ProductImage(1, "url", 1)],
                category: new Category({ id: 1, name: "Ropa", slug: "ropa", showInNavbar: false }),
                desc: "Descripción",
                brand: "Marca",
                stock: 10,
                weight: 1,
                size: null,
                width: null,
                length: null,
            })

            const entityData = (repo as any).mapToEntity(product)

            expect(entityData.size).toBeNull()
            expect(entityData.width).toBeNull()
            expect(entityData.length).toBeNull()
        })

        it("maps undefined measurements to null in Prisma data", () => {
            const product = new Product({
                id: 1,
                name: "Remera",
                price: 100,
                costPrice: 50,
                images: [new ProductImage(1, "url", 1)],
                category: new Category({ id: 1, name: "Ropa", slug: "ropa", showInNavbar: false }),
                desc: "Descripción",
                brand: "Marca",
                stock: 10,
                weight: 1,
                size: undefined,
                width: undefined,
                length: undefined,
            })

            const entityData = (repo as any).mapToEntity(product)

            expect(entityData.size).toBeNull()
            expect(entityData.width).toBeNull()
            expect(entityData.length).toBeNull()
        })
    })

    describe("mapToUpdateEntity (Domain → Prisma for update)", () => {
        it("maps size, width, and length to Prisma update data", () => {
            const product = new Product({
                id: 1,
                name: "Remera",
                price: 100,
                costPrice: 50,
                images: [new ProductImage(1, "url", 1)],
                category: new Category({ id: 1, name: "Ropa", slug: "ropa", showInNavbar: false }),
                desc: "Descripción",
                brand: "Marca",
                stock: 10,
                weight: 1,
                size: "XL",
                width: 50,
                length: 80,
            })

            const entityData = (repo as any).mapToUpdateEntity(product)

            expect(entityData.size).toBe("XL")
            expect(entityData.width).toBe(50)
            expect(entityData.length).toBe(80)
        })

        it("maps null measurements to null in Prisma update data", () => {
            const product = new Product({
                id: 1,
                name: "Remera",
                price: 100,
                costPrice: 50,
                images: [new ProductImage(1, "url", 1)],
                category: new Category({ id: 1, name: "Ropa", slug: "ropa", showInNavbar: false }),
                desc: "Descripción",
                brand: "Marca",
                stock: 10,
                weight: 1,
                size: null,
                width: null,
                length: null,
            })

            const entityData = (repo as any).mapToUpdateEntity(product)

            expect(entityData.size).toBeNull()
            expect(entityData.width).toBeNull()
            expect(entityData.length).toBeNull()
        })
    })

    describe("findAll with size filter", () => {
        it("passes sizes filter to Prisma WHERE clause", async () => {
            mockPrisma.product.findMany.mockResolvedValue([])

            await repo.findAll({ sizes: ["M", "L"] })

            expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    size: { in: ["M", "L"] },
                },
                include: { category: true, images: true },
            })
        })

        it("does not add size filter when sizes is empty", async () => {
            mockPrisma.product.findMany.mockResolvedValue([])

            await repo.findAll({ sizes: [] })

            expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                },
                include: { category: true, images: true },
            })
        })

        it("does not add size filter when sizes is undefined", async () => {
            mockPrisma.product.findMany.mockResolvedValue([])

            await repo.findAll({})

            expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                },
                include: { category: true, images: true },
            })
        })
    })

    describe("findAvailableSizes", () => {
        it("returns distinct non-null sizes sorted alphabetically", async () => {
            mockPrisma.product.findMany.mockResolvedValue([
                { size: "L" },
                { size: "M" },
                { size: "S" },
                { size: "XL" },
            ])

            const sizes = await repo.findAvailableSizes()

            expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    size: { not: null },
                },
                select: { size: true },
                distinct: ["size"],
            })
            expect(sizes).toEqual(["L", "M", "S", "XL"])
        })

        it("filters out null and empty sizes", async () => {
            mockPrisma.product.findMany.mockResolvedValue([
                { size: "M" },
                { size: null },
                { size: "" },
                { size: "L" },
            ])

            const sizes = await repo.findAvailableSizes()

            expect(sizes).toEqual(["L", "M"])
        })

        it("returns empty array when no sizes available", async () => {
            mockPrisma.product.findMany.mockResolvedValue([])

            const sizes = await repo.findAvailableSizes()

            expect(sizes).toEqual([])
        })
    })
})
