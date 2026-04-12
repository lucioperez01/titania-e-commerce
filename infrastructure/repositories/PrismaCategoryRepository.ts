import { CategoryRepository } from "@/domain/product/repositories/product/category-repository";
import { prisma } from "../db/prismaClient";
import { CategoryDTO } from "@/Interfaces/dto/product.dto";

export class PrismaCategoriesRepository implements CategoryRepository {
    async findAll(): Promise<CategoryDTO[]> {
        const categories = await prisma.category.findMany();
        return categories;
    }
    async findById(id: number): Promise<CategoryDTO | null> {
        const category = await prisma.category.findUnique({ where: { id } });
        return category;
    }
    async findBySlug(slug: string): Promise<CategoryDTO | null> {
        const category = await prisma.category.findUnique({ where: { slug } });
        return category;
    }
    async addCategory(category: CategoryDTO): Promise<void> {
        await prisma.category.create({ data: category });
    }
    async updateCategory(category: CategoryDTO): Promise<void> {
        await prisma.category.update({ where: { id: category.id }, data: category });
    }
    async deleteCategory(id: number): Promise<void> {
        await prisma.category.delete({ where: { id } });
    }
}