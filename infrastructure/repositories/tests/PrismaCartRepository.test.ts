// Mock prisma client BEFORE any imports
const fakeCarts: Array<{
  id: number;
  userId: number | null;
  status: string;
  abandonedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = [];

const fakeCartItems: Array<{
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  isDeleted: boolean;
  deletedAt: Date | null;
}> = [];

const fakeProducts: Array<{
  id: number;
  stock: number;
  name: string;
  slug: string;
  price: number;
  categoryId: number;
  rating: number;
  reservedStock: number;
  sold: number | null;
  isOnline: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  description: string | null;
  oldPrice: number | null;
  costPrice: number | null;
  weight: number | null;
  brand: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = [];

const mockPrismaCart = {
  findMany: jest.fn(async () => fakeCarts.map(c => ({
    ...c,
    items: fakeCartItems.filter(i => i.cartId === c.id),
  }))),
  findUnique: jest.fn(async ({ where, include }: { where: { id: number }; include?: { items: boolean } }) => {
    const cart = fakeCarts.find(c => c.id === where.id);
    if (!cart) return null;
    if (include?.items) {
      return { ...cart, items: fakeCartItems.filter(i => i.cartId === cart.id) };
    }
    return cart;
  }),
  findFirst: jest.fn(async ({ where, include }: { where: { userId?: number }; include?: { items: boolean } }) => {
    const cart = fakeCarts.find(c => c.userId === where.userId);
    if (!cart) return null;
    if (include?.items) {
      return { ...cart, items: fakeCartItems.filter(i => i.cartId === cart.id) };
    }
    return cart;
  }),
  upsert: jest.fn(async ({ where, create, update }: { where: { id: number }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
    const idx = fakeCarts.findIndex(c => c.id === where.id);
    if (idx === -1) {
      const id = fakeCarts.length + 1;
      const newCart = {
        id,
        userId: (create.userId as number | null) ?? null,
        status: (create.status as string) ?? "ACTIVE",
        abandonedAt: null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fakeCarts.push(newCart);
      // Handle nested items create
      const itemsCreate = (create as Record<string, unknown>).items as { create?: Array<{ productId: number; variantId?: number | null; quantity: number }> };
      if (itemsCreate?.create) {
        for (const item of itemsCreate.create) {
          fakeCartItems.push({
            id: fakeCartItems.length + 1,
            cartId: id,
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
            isDeleted: false,
            deletedAt: null,
          });
        }
      }
      return { ...newCart, items: fakeCartItems.filter(i => i.cartId === id) };
    } else {
      const itemsDelete = (update as Record<string, unknown>).items as { deleteMany?: Record<string, unknown>; create?: Array<{ productId: number; variantId?: number | null; quantity: number }> };
      if (itemsDelete?.deleteMany) {
        // Delete existing items for this cart
        for (let i = fakeCartItems.length - 1; i >= 0; i--) {
          if (fakeCartItems[i].cartId === fakeCarts[idx].id) {
            fakeCartItems.splice(i, 1);
          }
        }
      }
      if (itemsDelete?.create) {
        for (const item of itemsDelete.create) {
          fakeCartItems.push({
            id: fakeCartItems.length + 1,
            cartId: fakeCarts[idx].id,
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
            isDeleted: false,
            deletedAt: null,
          });
        }
      }
      fakeCarts[idx] = { ...fakeCarts[idx], userId: (update.userId as number | null) ?? fakeCarts[idx].userId, status: (update.status as string) ?? fakeCarts[idx].status, updatedAt: new Date() };
      return { ...fakeCarts[idx], items: fakeCartItems.filter(i => i.cartId === fakeCarts[idx].id) };
    }
  }),
  delete: jest.fn(async ({ where }: { where: { id: number } }) => {
    const idx = fakeCarts.findIndex(c => c.id === where.id);
    if (idx === -1) throw new Error("Record to delete not found.");
    fakeCarts.splice(idx, 1);
  }),
};

const mockPrismaCartItem = {
  create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const item = {
      id: fakeCartItems.length + 1,
      cartId: data.cartId as number,
      productId: data.productId as number,
      variantId: (data.variantId as number | null) ?? null,
      quantity: data.quantity as number,
      isDeleted: false,
      deletedAt: null,
    };
    fakeCartItems.push(item);
    return item;
  }),
  update: jest.fn(async ({ where, data }: { where: { id: number }; data: Record<string, unknown> }) => {
    const idx = fakeCartItems.findIndex(i => i.id === where.id);
    if (idx === -1) throw new Error("Record to update not found.");
    fakeCartItems[idx] = { ...fakeCartItems[idx], ...data };
    return fakeCartItems[idx];
  }),
  findUnique: jest.fn(async ({ where }: { where: { id: number } }) => {
    return fakeCartItems.find(i => i.id === where.id) ?? null;
  }),
};

const mockPrismaProduct = {
  findUnique: jest.fn(async ({ where }: { where: { id: number } }) => {
    return fakeProducts.find(p => p.id === where.id) ?? null;
  }),
};

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: {
    cart: mockPrismaCart,
    cartItem: mockPrismaCartItem,
    product: mockPrismaProduct,
  },
}));

import { PrismaCartRepository } from "../PrismaCartRepository";
import { Cart } from "@/domain/cart/entities/cart";
import { CartItem } from "@/domain/cart/entities/cartItem";
import { CartStatus } from "@/domain/cart/entities/cartStatus";

describe("PrismaCartRepository (mocked)", () => {
  let repo: PrismaCartRepository;

  beforeEach(() => {
    fakeCarts.length = 0;
    fakeCartItems.length = 0;
    fakeProducts.length = 0;
    jest.clearAllMocks();
    repo = new PrismaCartRepository();
  });

  describe("addItem", () => {
    it("should add a new item to an existing cart", async () => {
      fakeCarts.push({
        id: 1, userId: 1, status: "ACTIVE", abandonedAt: null,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      fakeProducts.push({
        id: 10, stock: 10, name: "Product A", slug: "product-a", price: 100,
        categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
        isDeleted: false, deletedAt: null, description: null, oldPrice: null,
        costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
      });

      await repo.addItem(1, 10, 2, null);

      expect(fakeCartItems.length).toBe(1);
      expect(fakeCartItems[0].productId).toBe(10);
      expect(fakeCartItems[0].quantity).toBe(2);
    });

    it("should increment quantity when item already exists", async () => {
      fakeCarts.push({
        id: 1, userId: 1, status: "ACTIVE", abandonedAt: null,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      fakeCartItems.push({
        id: 1, cartId: 1, productId: 10, variantId: null, quantity: 3,
        isDeleted: false, deletedAt: null,
      });
      fakeProducts.push({
        id: 10, stock: 10, name: "Product A", slug: "product-a", price: 100,
        categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
        isDeleted: false, deletedAt: null, description: null, oldPrice: null,
        costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
      });

      await repo.addItem(1, 10, 2, null);

      expect(fakeCartItems[0].quantity).toBe(5);
    });

    it("should throw when quantity exceeds stock", async () => {
      fakeCarts.push({
        id: 1, userId: 1, status: "ACTIVE", abandonedAt: null,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      fakeCartItems.push({
        id: 1, cartId: 1, productId: 10, variantId: null, quantity: 3,
        isDeleted: false, deletedAt: null,
      });
      fakeProducts.push({
        id: 10, stock: 4, name: "Product A", slug: "product-a", price: 100,
        categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
        isDeleted: false, deletedAt: null, description: null, oldPrice: null,
        costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
      });

      // Current qty 3 + adding 2 = 5, but stock is 4
      await expect(repo.addItem(1, 10, 2, null)).rejects.toThrow("Insufficient stock");
    });
  });

  describe("mergeItems", () => {
    it("should merge new items into an empty cart", async () => {
      fakeCarts.push({
        id: 1, userId: 1, status: "ACTIVE", abandonedAt: null,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      fakeProducts.push({
        id: 10, stock: 10, name: "Product A", slug: "product-a", price: 100,
        categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
        isDeleted: false, deletedAt: null, description: null, oldPrice: null,
        costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const anonymousItems = [{ productId: 10, quantity: 2, variantId: null as number | null }];
      await repo.mergeItems(1, anonymousItems);

      expect(fakeCartItems.length).toBe(1);
      expect(fakeCartItems[0].productId).toBe(10);
      expect(fakeCartItems[0].quantity).toBe(2);
    });

    it("should sum quantities for duplicate products", async () => {
      fakeCarts.push({
        id: 1, userId: 1, status: "ACTIVE", abandonedAt: null,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      fakeCartItems.push({
        id: 1, cartId: 1, productId: 10, variantId: null, quantity: 3,
        isDeleted: false, deletedAt: null,
      });
      fakeProducts.push({
        id: 10, stock: 10, name: "Product A", slug: "product-a", price: 100,
        categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
        isDeleted: false, deletedAt: null, description: null, oldPrice: null,
        costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const anonymousItems = [{ productId: 10, quantity: 2, variantId: null as number | null }];
      await repo.mergeItems(1, anonymousItems);

      expect(fakeCartItems[0].quantity).toBe(5);
    });

    it("should cap quantity at stock", async () => {
      fakeCarts.push({
        id: 1, userId: 1, status: "ACTIVE", abandonedAt: null,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      fakeCartItems.push({
        id: 1, cartId: 1, productId: 10, variantId: null, quantity: 2,
        isDeleted: false, deletedAt: null,
      });
      fakeProducts.push({
        id: 10, stock: 3, name: "Product A", slug: "product-a", price: 100,
        categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
        isDeleted: false, deletedAt: null, description: null, oldPrice: null,
        costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
      });

      // Current 2 + anonymous 5 = 7, but stock is 3 → cap at 3
      const anonymousItems = [{ productId: 10, quantity: 5, variantId: null as number | null }];
      await repo.mergeItems(1, anonymousItems);

      expect(fakeCartItems[0].quantity).toBe(3);
    });

    it("should handle multiple different products", async () => {
      fakeCarts.push({
        id: 1, userId: 1, status: "ACTIVE", abandonedAt: null,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });
      fakeCartItems.push({
        id: 1, cartId: 1, productId: 20, variantId: null, quantity: 4,
        isDeleted: false, deletedAt: null,
      });
      fakeProducts.push(
        {
          id: 10, stock: 10, name: "Product A", slug: "product-a", price: 100,
          categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
          isDeleted: false, deletedAt: null, description: null, oldPrice: null,
          costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
        },
        {
          id: 20, stock: 10, name: "Product B", slug: "product-b", price: 200,
          categoryId: 1, rating: 0, reservedStock: 0, sold: 0, isOnline: true,
          isDeleted: false, deletedAt: null, description: null, oldPrice: null,
          costPrice: null, weight: null, brand: null, createdAt: new Date(), updatedAt: new Date(),
        },
      );

      const anonymousItems = [
        { productId: 10, quantity: 2, variantId: null as number | null },
        { productId: 20, quantity: 1, variantId: null as number | null },
      ];
      await repo.mergeItems(1, anonymousItems);

      expect(fakeCartItems.length).toBe(2);
      const productA = fakeCartItems.find(i => i.productId === 10);
      const productB = fakeCartItems.find(i => i.productId === 20);
      expect(productA?.quantity).toBe(2);
      expect(productB?.quantity).toBe(5);
    });
  });
});
