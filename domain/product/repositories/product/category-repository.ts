import { Product } from '@/domain/product/entities/product'
import { Category } from '../../entities/category'

export interface CategoryRepository {
    findAll(): Promise<Category[]>
    findById(id: number): Promise<Category | null>
    findBySlug(slug: string): Promise<Category | null>
    addCategory(category: Category): Promise<void>
    updateCategory(category: Category): Promise<void>
    deleteCategory(id: number): Promise<void>
}