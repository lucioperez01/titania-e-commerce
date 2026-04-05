import { ProductRepository } from "@/domain/product/repositories/product/product-repository";
import { Product } from "@/domain/product/entities/product";

export class ProductService {
    constructor(
        private repo: ProductRepository
    ) { }

    async listProducts() {
        return this.repo.findAll()
    }

    async getProductBySlug(slug: string) {
        return this.repo.findBySlug(slug)
    }

    async getProductsById(id: number) {
        return this.repo.findById(id)
    }

    async getProductsByCategory(category: string) {
        return this.repo.findByCategory(category)
    }

    async addProduct(product: Product) {
        return this.repo.addProduct(product)
    }

    async updateProduct(product: Product) {
        return this.repo.updateProduct(product)
    }

    async deleteProduct(id: number) {
        return this.repo.deleteProduct(id)
    }


}