import { CategoryDTO } from '@/Interfaces/dto/product.dto'

export interface CategoryRepository {
    findAll(): Promise<CategoryDTO[]>
    findById(id: number): Promise<CategoryDTO | null>
    findBySlug(slug: string): Promise<CategoryDTO | null>
    findAllActive(): Promise<CategoryDTO[]>
    findNavbarCategories(limit?: number): Promise<CategoryDTO[]>
    addCategory(category: CategoryDTO): Promise<void>
    updateCategory(category: CategoryDTO): Promise<void>
    deleteCategory(id: number): Promise<void>
}