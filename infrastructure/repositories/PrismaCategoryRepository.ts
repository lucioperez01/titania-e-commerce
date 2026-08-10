import { CategoryRepository } from "@/domain/product/repositories/product/category-repository";
import { prisma } from "../db/prismaClient";
import { CategoryDTO } from "@/Interfaces/dto/product.dto";

export class PrismaCategoriesRepository implements CategoryRepository {
    private mapToDTO(category: { id: number; name: string; slug: string; image: string | null }): CategoryDTO {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            image: category.image ?? undefined,
        }
    }

    private mapToData(category: CategoryDTO): { name: string; slug: string; image?: string } {
        const data: { name: string; slug: string; image?: string } = {
            name: category.name,
            slug: category.slug,
        }
        if (category.image) {
            data.image = category.image
        }
        return data
    }

    async findAll(): Promise<CategoryDTO[]> {
        const categories = await prisma.category.findMany();
        return categories.map(category => this.mapToDTO(category));
    }

    async findById(id: number): Promise<CategoryDTO | null> {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) return null;
        return this.mapToDTO(category);
    }
    async findBySlug(slug: string): Promise<CategoryDTO | null> {
        const category = await prisma.category.findUnique({ where: { slug } });
        if (!category) return null;
        return this.mapToDTO(category);
    }

    async findAllActive(): Promise<CategoryDTO[] | null> {
        const categories = await prisma.category.findMany({ where: { isDeleted: false } })
        return categories.map(category => this.mapToDTO(category));
    }

    async addCategory(category: CategoryDTO): Promise<void> {
        await prisma.category.create({ data: this.mapToData(category) });
    }
    async updateCategory(category: CategoryDTO): Promise<void> {
        await prisma.category.update({ where: { id: category.id }, data: this.mapToData(category) });
    }
    async deleteCategory(id: number): Promise<void> {
        await prisma.category.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() }
        });
    }
}
