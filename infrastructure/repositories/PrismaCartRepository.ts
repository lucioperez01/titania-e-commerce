import { Cart } from "@/domain/cart/entities/cart";
import { CartItem } from "@/domain/cart/entities/cartItem";
import { CartRepository } from "@/domain/cart/repositories/cart-repository";
import { prisma } from "../db/prismaClient";
import { CartStatus } from "@/domain/cart/entities/cartStatus";

export class PrismaCartRepository implements CartRepository {
    async findAll(): Promise<Cart[]> {
        const carts = await prisma.cart.findMany({
            include: { items: true }
        });
        return carts.map(c => this.mapToDomain(c));
    }

    async findById(id: number): Promise<Cart | null> {
        const cart = await prisma.cart.findUnique({
            where: { id },
            include: { items: true }
        });
        return cart ? this.mapToDomain(cart) : null;
    }

    async findByUserId(userId: number): Promise<Cart | null> {
        const cart = await prisma.cart.findFirst({
            where: { userId },
            include: { items: true }
        });
        return cart ? this.mapToDomain(cart) : null;
    }

    async findAbandoned(): Promise<Cart[]> {
        const carts = await prisma.cart.findMany({
            where: { status: 'ABANDONED' as any },
            include: { items: true }
        });
        return carts.map(c => this.mapToDomain(c));
    }

    async save(cart: Cart): Promise<void> {
        await prisma.cart.upsert({
            where: { id: cart.id || -1 },
            update: {
                userId: cart.userId,
                status: this.mapStatusToPrisma(cart.status),
                abandonedAt: cart.abandonedAt,
                items: {
                    deleteMany: {},
                    create: cart.items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity
                    }))
                }
            },
            create: {
                userId: cart.userId,
                status: this.mapStatusToPrisma(cart.status),
                abandonedAt: cart.abandonedAt,
                items: {
                    create: cart.items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity
                    }))
                }
            }
        });
    }

    async delete(id: number): Promise<void> {
        await prisma.cart.delete({
            where: { id }
        });
    }

    private mapToDomain(data: any): Cart {
        const items = (data.items || []).map((item: any) => new CartItem(
            item.id,
            item.cartId,
            item.productId,
            item.quantity,
            item.variantId
        ));

        return new Cart(
            data.id,
            data.userId,
            items,
            data.abandonedAt,
            this.mapStatusToDomain(data.status),
            data.createdAt,
            data.updatedAt
        );
    }

    private mapStatusToDomain(status: string): CartStatus {
        switch (status) {
            case 'ACTIVE': return CartStatus.ACTIVE;
            case 'ABANDONED': return CartStatus.ABANDONED;
            case 'CONVERTED': return CartStatus.CONVERTED;
            default: return CartStatus.ACTIVE;
        }
    }

    private mapStatusToPrisma(status: CartStatus): any {
        switch (status) {
            case CartStatus.ACTIVE: return 'ACTIVE';
            case CartStatus.ABANDONED: return 'ABANDONED';
            case CartStatus.CONVERTED: return 'CONVERTED';
            default: return 'ACTIVE';
        }
    }
}