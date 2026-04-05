import { Product } from '@/domain/product/entities/product'
import { Category } from '../../entities/category'

export interface ProductRepository {
    findAll(): Promise<Product[]>
    findById(id: number): Promise<Product | null>
    findBySlug(slug: string): Promise<Product | null>
    addProduct(product: Product): Promise<void>
    updateProduct(product: Product): Promise<void>
    deleteProduct(id: number): Promise<void>
    findByCategory(category: Category): Promise<Product[]>
}