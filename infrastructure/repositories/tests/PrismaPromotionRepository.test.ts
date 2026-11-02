// Mock prisma client BEFORE any imports
const fakePromotions: Array<{
  id: number;
  name: string;
  type: "COUPON" | "AUTOMATIC";
  couponCode: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = [];

const fakeConditions: Array<{
  id: number;
  promotionId: number;
  minQuantity: number | null;
  minSubtotal: number | null;
  productId: number | null;
  variantId: number | null;
  isDeleted: boolean;
  deletedAt: Date | null;
}> = [];

const fakeBenefits: Array<{
  id: number;
  promotionId: number;
  discountType: "PERCENTAGE" | "FIXED" | "BUY_X_GET_Y";
  value: number;
  applyToProductId: number | null;
  applyToVariantId: number | null;
  isDeleted: boolean;
  deletedAt: Date | null;
}> = [];

const mockPrismaPromotion = {
  findMany: jest.fn(async ({ where, include, skip, take }: any) => {
    let results = fakePromotions.filter((p) => !p.isDeleted);

    // Apply where filters (simplified for testing)
    if (where?.AND) {
      for (const condition of where.AND) {
        if (condition.isDeleted !== undefined) {
          results = results.filter((p) => p.isDeleted === condition.isDeleted);
        }
        if (condition.active !== undefined) {
          results = results.filter((p) => p.active === condition.active);
        }
        if (condition.type !== undefined) {
          results = results.filter((p) => p.type === condition.type);
        }
        if (condition.startsAt?.lte) {
          results = results.filter((p) => !p.startsAt || p.startsAt <= condition.startsAt.lte);
        }
        if (condition.endsAt?.gte) {
          results = results.filter((p) => !p.endsAt || p.endsAt >= condition.endsAt.gte);
        }
        if (condition.OR) {
          results = results.filter((p) => {
            return condition.OR.some((or: any) => {
              if (or.endsAt?.gte) return !p.endsAt || p.endsAt >= or.endsAt.gte;
              if (or.endsAt === null) return p.endsAt === null;
              return true;
            });
          });
        }
      }
    }

    // Pagination
    const paginated = skip !== undefined ? results.slice(skip) : results;
    const limited = take !== undefined ? paginated.slice(0, take) : paginated;

    return limited.map((p) => ({
      ...p,
      conditions: fakeConditions.filter((c) => c.promotionId === p.id && !c.isDeleted),
      benefits: fakeBenefits.filter((b) => b.promotionId === p.id && !b.isDeleted),
    }));
  }),

  findUnique: jest.fn(async ({ where, include }: any) => {
    const promotion = fakePromotions.find((p) => p.id === where.id && !p.isDeleted);
    if (!promotion) return null;

    return {
      ...promotion,
      conditions: fakeConditions.filter((c) => c.promotionId === promotion.id),
      benefits: fakeBenefits.filter((b) => b.promotionId === promotion.id),
    };
  }),

  findFirst: jest.fn(async ({ where, select }: any) => {
    const promotion = fakePromotions.find((p) => {
      if (where.id !== undefined && p.id !== where.id) return false;
      if (where.isDeleted !== undefined && p.isDeleted !== where.isDeleted) return false;
      return true;
    });

    if (!promotion) return null;

    if (select?.active) {
      return { active: promotion.active };
    }

    return {
      ...promotion,
      conditions: fakeConditions.filter((c) => c.promotionId === promotion.id),
      benefits: fakeBenefits.filter((b) => b.promotionId === promotion.id),
    };
  }),

  create: jest.fn(async ({ data, include }: any) => {
    const id = fakePromotions.length + 1;
    const promotion = {
      id,
      name: data.name,
      type: data.type,
      couponCode: data.couponCode ?? null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      active: data.active ?? true,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    fakePromotions.push(promotion);

    // Handle nested conditions create
    if (data.conditions?.create) {
      for (const condition of data.conditions.create) {
        fakeConditions.push({
          id: fakeConditions.length + 1,
          promotionId: id,
          minQuantity: condition.minQuantity ?? null,
          minSubtotal: condition.minSubtotal ?? null,
          productId: condition.productId ?? null,
          variantId: condition.variantId ?? null,
          isDeleted: false,
          deletedAt: null,
        });
      }
    }

    // Handle nested benefits create
    if (data.benefits?.create) {
      for (const benefit of data.benefits.create) {
        fakeBenefits.push({
          id: fakeBenefits.length + 1,
          promotionId: id,
          discountType: benefit.discountType,
          value: benefit.value,
          applyToProductId: benefit.applyToProductId ?? null,
          applyToVariantId: benefit.applyToVariantId ?? null,
          isDeleted: false,
          deletedAt: null,
        });
      }
    }

    return {
      ...promotion,
      conditions: fakeConditions.filter((c) => c.promotionId === id),
      benefits: fakeBenefits.filter((b) => b.promotionId === id),
    };
  }),

  update: jest.fn(async ({ where, data, include }: any) => {
    const idx = fakePromotions.findIndex((p) => p.id === where.id);
    if (idx === -1) throw new Error("Record to update not found.");

    fakePromotions[idx] = {
      ...fakePromotions[idx],
      ...data,
      updatedAt: new Date(),
    };

    return {
      ...fakePromotions[idx],
      conditions: fakeConditions.filter((c) => c.promotionId === where.id),
      benefits: fakeBenefits.filter((b) => b.promotionId === where.id),
    };
  }),

  count: jest.fn(async ({ where }: any) => {
    let results = fakePromotions.filter((p) => !p.isDeleted);

    if (where) {
      if (where.isDeleted !== undefined) {
        results = results.filter((p) => p.isDeleted === where.isDeleted);
      }
      if (where.id?.not !== undefined) {
        results = results.filter((p) => p.id !== where.id.not);
      }
      if (where.couponCode?.equals !== undefined) {
        const code = where.couponCode.equals;
        const mode = where.couponCode.mode;
        results = results.filter((p) => {
          if (p.couponCode === null) return false;
          if (mode === "insensitive") {
            return p.couponCode.toLowerCase() === code.toLowerCase();
          }
          return p.couponCode === code;
        });
      }
      if (where.AND) {
        for (const condition of where.AND) {
          if (condition.isDeleted !== undefined) {
            results = results.filter((p) => p.isDeleted === condition.isDeleted);
          }
          if (condition.active !== undefined) {
            results = results.filter((p) => p.active === condition.active);
          }
          if (condition.type !== undefined) {
            results = results.filter((p) => p.type === condition.type);
          }
        }
      }
    }

    return results.length;
  }),
};

const mockPrismaPromotionCondition = {
  updateMany: jest.fn(async ({ where, data }: any) => {
    const conditions = fakeConditions.filter((c) => {
      if (where.promotionId !== undefined && c.promotionId !== where.promotionId) return false;
      if (where.isDeleted !== undefined && c.isDeleted !== where.isDeleted) return false;
      return true;
    });

    for (const condition of conditions) {
      Object.assign(condition, data);
    }

    return { count: conditions.length };
  }),

  createMany: jest.fn(async ({ data }: any) => {
    for (const condition of data) {
      fakeConditions.push({
        id: fakeConditions.length + 1,
        ...condition,
        isDeleted: false,
        deletedAt: null,
      });
    }
    return { count: data.length };
  }),
};

const mockPrismaPromotionBenefit = {
  updateMany: jest.fn(async ({ where, data }: any) => {
    const benefits = fakeBenefits.filter((b) => {
      if (where.promotionId !== undefined && b.promotionId !== where.promotionId) return false;
      if (where.isDeleted !== undefined && b.isDeleted !== where.isDeleted) return false;
      return true;
    });

    for (const benefit of benefits) {
      Object.assign(benefit, data);
    }

    return { count: benefits.length };
  }),

  createMany: jest.fn(async ({ data }: any) => {
    for (const benefit of data) {
      fakeBenefits.push({
        id: fakeBenefits.length + 1,
        ...benefit,
        isDeleted: false,
        deletedAt: null,
      });
    }
    return { count: data.length };
  }),
};

const mockPrismaTransaction = {
  promotion: mockPrismaPromotion,
  promotionCondition: mockPrismaPromotionCondition,
  promotionBenefit: mockPrismaPromotionBenefit,
};

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: {
    promotion: mockPrismaPromotion,
    promotionCondition: mockPrismaPromotionCondition,
    promotionBenefit: mockPrismaPromotionBenefit,
    $transaction: jest.fn(async (fn: any) => fn(mockPrismaTransaction)),
  },
}));

import { PrismaPromotionRepository } from "../PrismaPromotionRepository";

describe("PrismaPromotionRepository (mocked)", () => {
  let repo: PrismaPromotionRepository;

  beforeEach(() => {
    fakePromotions.length = 0;
    fakeConditions.length = 0;
    fakeBenefits.length = 0;
    jest.clearAllMocks();
    repo = new PrismaPromotionRepository();
  });

  describe("findById", () => {
    it("should find promotion by id excluding soft-deleted", async () => {
      fakePromotions.push({
        id: 1,
        name: "Summer Sale",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.findById(1);

      expect(result).toBeTruthy();
      expect(result?.name).toBe("Summer Sale");
    });

    it("should return null for soft-deleted promotion", async () => {
      fakePromotions.push({
        id: 1,
        name: "Deleted Sale",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: true,
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.findById(1);

      expect(result).toBeNull();
    });

    it("should return null for non-existent id", async () => {
      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return promotions with default pagination", async () => {
      fakePromotions.push(
        {
          id: 1,
          name: "Sale 1",
          type: "AUTOMATIC",
          couponCode: null,
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Sale 2",
          type: "COUPON",
          couponCode: "CODE1",
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );

      const result = await repo.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrismaPromotion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        })
      );
    });

    it("should apply custom pagination", async () => {
      for (let i = 1; i <= 60; i++) {
        fakePromotions.push({
          id: i,
          name: `Sale ${i}`,
          type: "AUTOMATIC",
          couponCode: null,
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const result = await repo.findAll({ page: 2, limit: 10 });

      expect(mockPrismaPromotion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it("should filter by type", async () => {
      fakePromotions.push(
        {
          id: 1,
          name: "Auto Sale",
          type: "AUTOMATIC",
          couponCode: null,
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Coupon Sale",
          type: "COUPON",
          couponCode: "CODE",
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );

      await repo.findAll({ type: "COUPON" });

      expect(mockPrismaPromotion.findMany).toHaveBeenCalled();
    });

    it("should handle large datasets (1000+ promotions)", async () => {
      for (let i = 1; i <= 1000; i++) {
        fakePromotions.push({
          id: i,
          name: `Sale ${i}`,
          type: "AUTOMATIC",
          couponCode: null,
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const startTime = Date.now();
      const result = await repo.findAll({ page: 1, limit: 10 });
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(10);
      expect(duration).toBeLessThan(100);
    });
  });

  describe("count", () => {
    it("should return total count", async () => {
      fakePromotions.push(
        {
          id: 1,
          name: "Sale 1",
          type: "AUTOMATIC",
          couponCode: null,
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Sale 2",
          type: "COUPON",
          couponCode: "CODE",
          startsAt: null,
          endsAt: null,
          active: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );

      const result = await repo.count();

      expect(result).toBe(2);
    });
  });

  describe("create", () => {
    it("should create promotion with nested conditions and benefits", async () => {
      const data = {
        name: "Summer Sale",
        type: "AUTOMATIC" as const,
        startsAt: new Date("2026-01-01"),
        endsAt: new Date("2026-02-01"),
        conditions: [
          { minQuantity: 2, minSubtotal: 1000 },
          { productId: 10 },
        ],
        benefits: [
          { discountType: "PERCENTAGE" as const, value: 20 },
        ],
      };

      const result = await repo.create(data);

      expect(result.name).toBe("Summer Sale");
      expect(fakePromotions).toHaveLength(1);
      expect(fakeConditions).toHaveLength(2);
      expect(fakeBenefits).toHaveLength(1);
      expect(result.conditions).toHaveLength(2);
      expect(result.benefits).toHaveLength(1);
    });

    it("should default active to true", async () => {
      const data = {
        name: "Test Sale",
        type: "AUTOMATIC" as const,
        conditions: [],
        benefits: [{ discountType: "PERCENTAGE" as const, value: 10 }],
      };

      const result = await repo.create(data);

      expect(result.active).toBe(true);
    });

    it("should use $transaction", async () => {
      const data = {
        name: "Test",
        type: "AUTOMATIC" as const,
        conditions: [],
        benefits: [{ discountType: "PERCENTAGE" as const, value: 10 }],
      };

      await repo.create(data);

      expect(jest.mocked(require("@/infrastructure/db/prismaClient").prisma.$transaction)).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update promotion fields", async () => {
      fakePromotions.push({
        id: 1,
        name: "Old Name",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.update(1, { name: "New Name" });

      expect(result.name).toBe("New Name");
    });

    it("should replace conditions (soft-delete old + create new)", async () => {
      fakePromotions.push({
        id: 1,
        name: "Sale",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      fakeConditions.push({
        id: 1,
        promotionId: 1,
        minQuantity: 2,
        minSubtotal: null,
        productId: null,
        variantId: null,
        isDeleted: false,
        deletedAt: null,
      });

      await repo.update(1, {
        conditions: [{ minQuantity: 5 }],
      });

      expect(mockPrismaPromotionCondition.updateMany).toHaveBeenCalled();
      expect(mockPrismaPromotionCondition.createMany).toHaveBeenCalled();
    });

    it("should skip createMany when conditions array is empty", async () => {
      fakePromotions.push({
        id: 1,
        name: "Sale",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repo.update(1, { conditions: [] });

      expect(mockPrismaPromotionCondition.updateMany).toHaveBeenCalled();
      expect(mockPrismaPromotionCondition.createMany).not.toHaveBeenCalled();
    });

    it("should throw when promotion not found after update", async () => {
      await expect(repo.update(999, { name: "Test" })).rejects.toThrow();
    });
  });

  describe("softDelete", () => {
    it("should mark promotion as deleted", async () => {
      fakePromotions.push({
        id: 1,
        name: "Sale",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repo.softDelete(1);

      expect(fakePromotions[0].isDeleted).toBe(true);
      expect(fakePromotions[0].deletedAt).toBeTruthy();
    });
  });

  describe("toggleActive", () => {
    it("should toggle active flag", async () => {
      fakePromotions.push({
        id: 1,
        name: "Sale",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.toggleActive(1);

      expect(result.active).toBe(false);
    });

    it("should throw when promotion not found", async () => {
      await expect(repo.toggleActive(999)).rejects.toThrow("Promotion 999 not found");
    });
  });

  describe("existsByCode", () => {
    it("should return true when code exists", async () => {
      fakePromotions.push({
        id: 1,
        name: "Sale",
        type: "COUPON",
        couponCode: "SUMMER20",
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.existsByCode("SUMMER20");

      expect(result).toBe(true);
    });

    it("should return false when code does not exist", async () => {
      const result = await repo.existsByCode("NONEXISTENT");

      expect(result).toBe(false);
    });

    it("should exclude promotion by id when provided", async () => {
      fakePromotions.push({
        id: 1,
        name: "Sale 1",
        type: "COUPON",
        couponCode: "CODE1",
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.existsByCode("CODE1", 1);

      expect(result).toBe(false);
    });
  });

  describe("concurrent updates", () => {
    it("should handle concurrent updates to same promotion", async () => {
      fakePromotions.push({
        id: 1,
        name: "Sale",
        type: "AUTOMATIC",
        couponCode: null,
        startsAt: null,
        endsAt: null,
        active: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatePromises = Array(10)
        .fill(null)
        .map(() => repo.update(1, { name: "Updated" }));

      const results = await Promise.allSettled(updatePromises);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      expect(fulfilled.length).toBeGreaterThan(0);
    });
  });
});
