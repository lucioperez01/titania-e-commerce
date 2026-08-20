import { WishlistRepository } from "@/domain/wishlist/repositories/wishlist-repository"
import { prisma } from "../db/prismaClient"

export class PrismaWishlistRepository implements WishlistRepository {
    async findByUserId(userId: number): Promise<number[]> {
        const items = await prisma.wishlistItem.findMany({
            where: { userId },
            select: { productId: true },
        })
        return items.map(i => i.productId)
    }

    async add(userId: number, productId: number): Promise<void> {
        await prisma.wishlistItem.create({
            data: { userId, productId },
        }).catch(() => {})
    }

    async remove(userId: number, productId: number): Promise<void> {
        await prisma.wishlistItem.deleteMany({
            where: { userId, productId },
        })
    }

    async exists(userId: number, productId: number): Promise<boolean> {
        const count = await prisma.wishlistItem.count({
            where: { userId, productId },
        })
        return count > 0
    }

    async countByUserId(userId: number): Promise<number> {
        return prisma.wishlistItem.count({ where: { userId } })
    }
}
