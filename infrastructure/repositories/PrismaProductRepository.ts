import { prisma } from "../db/prismaClient"
import { ProductRepository } from "@/domain/product/repositories/product/product-repository"
import { Product } from "@/domain/product/entities/product"
import { Category } from "@/domain/product/entities/category"

export class PrismaProductRepository implements ProductRepository {

    async findAll(): Promise<Product[]> {
        const products = await prisma.product.findMany()
        return products.map(p => this.mapToProduct(p))
    }

    private mapToProduct(data: any): Product { // eslint-disable-line @typescript-eslint/no-explicit-any -- reads relation field (data.category) without include; proper typing forces Prisma payload generics that don't match the domain Category
        return new Product({
            id: data.id,
            name: data.name,
            slug: data.slug,
            desc: data.description,
            price: data.price,
            oldPrice: data.oldPrice,
            costPrice: data.costPrice,
            stock: data.stock,
            weight: data.weight,
            images: data.images || [],
            category: data.category,
            brand: data.brand,
            rating: data.rating,
            sold: data.sold
        })
    }

    private mapToEntity(product: Product): any { // eslint-disable-line @typescript-eslint/no-explicit-any -- return shape is an ad-hoc Prisma create payload; the `as any` on categoryId bridges a domain/prisma enum mismatch
        return {
            name: product.name,
            slug: product.slug,
            description: product.desc,
            price: product.price,
            oldPrice: product.oldPrice,
            costPrice: product.costPrice,
            stock: product.stock,
            weight: product.weight,
            images: {
                createMany: {
                    data: product.images
                }
            },
            category: {
                connect: { id: product.category.id }
            }
        }
    }

    async findByCategory(category: Category): Promise<Product[]> {
        const products = await prisma.product.findMany({ where: { category } })
        return products.map(p => this.mapToProduct(p))
    }

    async findById(id: number): Promise<Product | null> {
        const product = await prisma.product.findUnique({ where: { id } })
        return this.mapToProduct(product)
    }

    async findBySlug(slug: string): Promise<Product | null> {
        const product = await prisma.product.findFirst({ where: { slug } })
        return this.mapToProduct(product)
    }


    async addProduct(product: Product): Promise<void> {
        if (product != null && product.images != null) {
            await prisma.product.create({
                data: this.mapToEntity(product)
            })
        }
        else {
            throw new Error("El producto debe existir y no puede no tener imagenes")
        }
    }

    async deleteProduct(id: number): Promise<void> {
        if (id != null) {
            await prisma.product.delete({ where: { id } })
        }
    }

    async updateProduct(product: Product): Promise<void> {
        if (product != null && product.price != null) {
            await prisma.product.update(this.mapToEntity(product))
        }
    }


}