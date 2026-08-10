import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"

export async function deleteProduct(id: number): Promise<void> {
    const repo = new PrismaProductRepository()
    await repo.deleteProduct(id)
}
