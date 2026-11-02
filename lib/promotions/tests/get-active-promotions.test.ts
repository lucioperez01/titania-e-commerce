// Mock dependencies BEFORE imports
const mockPromotionFindMany = jest.fn()

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: {
    promotion: {
      findMany: (...args: unknown[]) => mockPromotionFindMany(...args),
    },
  },
}))

// Pass-through unstable_cache so the exported function calls the inner fn directly
jest.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

import { Decimal } from "@prisma/client/runtime/library"
import { getActivePromotions } from "../get-active-promotions"

// ── Helpers ──────────────────────────────────────────────────────────────

function makeDecimal(value: number): Decimal {
  return new Decimal(value)
}

function makePromotion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Test Promotion",
    type: "AUTOMATIC",
    active: true,
    isDeleted: false,
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2026-12-31T23:59:59Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
    conditions: [],
    benefits: [
      {
        discountType: "PERCENTAGE",
        value: makeDecimal(20),
      },
    ],
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("getActivePromotions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe("date filtering", () => {
    it("should return promotions active at current date", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "Summer Sale",
          startsAt: new Date("2026-06-01"),
          endsAt: new Date("2026-07-01"),
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Summer Sale")
    })

    it("should exclude promotions not yet started", async () => {
      jest.setSystemTime(new Date("2026-01-01T00:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([])

      const result = await getActivePromotions()

      expect(result).toHaveLength(0)
    })

    it("should include promotion that starts exactly now", async () => {
      const now = new Date("2026-06-15T12:00:00Z")
      jest.setSystemTime(now)

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "Start Now Sale",
          startsAt: now,
          endsAt: new Date("2026-12-31"),
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Start Now Sale")
    })

    it("should include promotion that expires exactly now", async () => {
      const now = new Date("2026-06-15T12:00:00Z")
      jest.setSystemTime(now)

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "End Now Sale",
          startsAt: new Date("2026-01-01"),
          endsAt: now,
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("End Now Sale")
    })

    it("should handle null startDate (always active from the past)", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "No Start Sale",
          startsAt: null,
          endsAt: new Date("2026-12-31"),
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(1)
    })

    it("should handle null endDate (never expires)", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "No End Sale",
          startsAt: new Date("2026-01-01"),
          endsAt: null,
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(1)
    })

    it("should handle both null dates (always active)", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "Always Active",
          startsAt: null,
          endsAt: null,
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(1)
    })
  })

  describe("formatBenefit", () => {
    it("should format PERCENTAGE benefit", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Summer",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(20) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("20% OFF")
    })

    it("should format FIXED benefit with es-AR locale", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Discount",
          benefits: [{ discountType: "FIXED", value: makeDecimal(5000) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("$5.000 OFF")
    })

    it("should format BUY_X_GET_Y benefit", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "BuyXGetY",
          benefits: [{ discountType: "BUY_X_GET_Y", value: makeDecimal(15) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("15% OFF")
    })

    it("should return null for NaN benefit value", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Bad Value",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(NaN) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      // NaN benefit → null message → filtered out
      expect(result).toHaveLength(0)
    })

    it("should return null for benefit value ≤ 0", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Zero Value",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(0) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(0)
    })

    it("should return null for unknown discount type", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Unknown Type",
          benefits: [{ discountType: "UNKNOWN", value: makeDecimal(10) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(0)
    })
  })

  describe("formatCondition", () => {
    it("should format minSubtotal condition with es-AR locale", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "MinSubtotal",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(20) }],
          conditions: [{ minSubtotal: makeDecimal(30000), minQuantity: null }],
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("en compras desde $30.000")
    })

    it("should format minQuantity condition", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "MinQty",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [{ minSubtotal: null, minQuantity: 3 }],
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("llevando 3 unidades")
    })

    it("should omit condition when both null", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "No Condition",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [{ minSubtotal: null, minQuantity: null }],
        }),
      ])

      const result = await getActivePromotions()

      // Should not contain condition text
      expect(result[0].message).not.toContain("en compras desde")
      expect(result[0].message).not.toContain("llevando")
    })

    it("should omit condition when no conditions array", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Empty Conditions",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).not.toContain("en compras desde")
      expect(result[0].message).not.toContain("llevando")
    })
  })

  describe("formatValidity", () => {
    it("should format validity as dd/MM", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Sale",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [],
          endsAt: new Date("2026-12-31T23:59:59Z"),
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("válido hasta 31/12")
    })

    it("should omit validity when endsAt is null", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "No End",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [],
          endsAt: null,
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).not.toContain("válido hasta")
    })

    it("should pad single-digit day and month", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "Padded Date",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [],
          endsAt: new Date("2026-02-05T23:59:59Z"),
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("válido hasta 05/02")
    })
  })

  describe("full message composition", () => {
    it("should join name + benefit + condition + validity", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "VERANO",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(20) }],
          conditions: [{ minSubtotal: makeDecimal(30000), minQuantity: null }],
          endsAt: new Date("2026-12-31"),
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].message).toContain("VERANO")
      expect(result[0].message).toContain("20% OFF")
      expect(result[0].message).toContain("en compras desde")
      expect(result[0].message).toContain("válido hasta")
    })

    it("should trim name whitespace", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          name: "  Spaced Name  ",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result[0].name).toBe("  Spaced Name  ")
      // Message should not have double spaces
      expect(result[0].message).not.toContain("  ")
    })

    it("should filter out promotions with no valid benefit text", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "Bad Promo",
          benefits: [],
          conditions: [],
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(0)
    })
  })

  describe("empty results", () => {
    it("should return empty array when no promotions found", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))
      mockPromotionFindMany.mockResolvedValue([])

      const result = await getActivePromotions()

      expect(result).toEqual([])
    })
  })

  describe("multiple active promotions", () => {
    it("should return all active promotions", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      mockPromotionFindMany.mockResolvedValue([
        makePromotion({
          id: 1,
          name: "Sale 1",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [],
        }),
        makePromotion({
          id: 2,
          name: "Sale 2",
          benefits: [{ discountType: "FIXED", value: makeDecimal(5000) }],
          conditions: [],
        }),
        makePromotion({
          id: 3,
          name: "Sale 3",
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(15) }],
          conditions: [{ minQuantity: 2 }],
        }),
      ])

      const result = await getActivePromotions()

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
      expect(result[2].id).toBe(3)
    })
  })

  describe("performance", () => {
    it("should handle 100+ active promotions", async () => {
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))

      const promotions = Array.from({ length: 100 }, (_, i) =>
        makePromotion({
          id: i + 1,
          name: `Sale ${i + 1}`,
          benefits: [{ discountType: "PERCENTAGE", value: makeDecimal(10) }],
          conditions: [],
        })
      )

      mockPromotionFindMany.mockResolvedValue(promotions)

      const startTime = Date.now()
      const result = await getActivePromotions()
      const duration = Date.now() - startTime

      expect(result).toHaveLength(100)
      expect(duration).toBeLessThan(500)
    })
  })
})
