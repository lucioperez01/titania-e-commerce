import { Cart } from "@/domain/cart/entities/cart";
import { CartItem } from "@/domain/cart/entities/cartItem";
import { CartRepository, CartItemInput } from "@/domain/cart/repositories/cart-repository";
import { prisma } from "../db/prismaClient";
import { CartStatus } from "@/domain/cart/entities/cartStatus";
import { Prisma, CartStatus as PrismaCartStatus, CartItem as PrismaCartItem } from "@prisma/client";

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
            where: { status: PrismaCartStatus.ABANDONED },
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

    async addItem(cartId: number, productId: number, quantity: number, variantId: number | null): Promise<void> {
        const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: { items: true }
        });
        if (!cart) throw new Error("Cart not found");

        const existingItem = cart.items.find(
            item => item.productId === productId && (item.variantId ?? null) === (variantId ?? null)
        );

        if (existingItem) {
            const desiredQty = existingItem.quantity + quantity;
            const stock = await this.getProductStock(productId, variantId);
            if (desiredQty > stock) {
                throw new Error("Insufficient stock");
            }
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: desiredQty }
            });
        } else {
            const stock = await this.getProductStock(productId, variantId);
            if (quantity > stock) {
                throw new Error("Insufficient stock");
            }
            await prisma.cartItem.create({
                data: {
                    cartId,
                    productId,
                    variantId,
                    quantity
                }
            });
        }
    }

    async mergeItems(cartId: number, items: CartItemInput[]): Promise<void> {
        const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: { items: true }
        });
        if (!cart) throw new Error("Cart not found");

        for (const item of items) {
            const existingItem = cart.items.find(
                ci => ci.productId === item.productId && (ci.variantId ?? null) === (item.variantId ?? null)
            );

            if (existingItem) {
                const desiredQty = existingItem.quantity + item.quantity;
                const stock = await this.getProductStock(item.productId, item.variantId ?? null);
                const cappedQty = Math.min(desiredQty, stock);
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: cappedQty }
                });
            } else {
                const stock = await this.getProductStock(item.productId, item.variantId ?? null);
                const cappedQty = Math.min(item.quantity, stock);
                if (cappedQty > 0) {
                    await prisma.cartItem.create({
                        data: {
                            cartId,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: cappedQty
                        }
                    });
                }
            }
        }
    }

    private async getProductStock(productId: number, variantId: number | null): Promise<number> {
        if (variantId) {
            const variant = await prisma.product.findUnique({
                where: { id: productId },
                include: { variants: true }
            });
            const v = variant?.variants?.find(v => v.id === variantId);
            return v?.stock ?? 0;
        }
        const product = await prisma.product.findUnique({ where: { id: productId } });
        return product?.stock ?? 0;
    }

    private mapToDomain(data: Prisma.CartGetPayload<{ include: { items: true } }>): Cart {
        const items = (data.items || []).map((item: PrismaCartItem) => new CartItem(
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

    private mapStatusToPrisma(status: CartStatus): PrismaCartStatus {
        switch (status) {
            case CartStatus.ACTIVE: return 'ACTIVE';
            case CartStatus.ABANDONED: return 'ABANDONED';
            case CartStatus.CONVERTED: return 'CONVERTED';
            default: return 'ACTIVE';
        }
    }
}
