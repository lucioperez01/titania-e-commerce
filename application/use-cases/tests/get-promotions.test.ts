// ── Mock repository BEFORE importing use case ────────────────────────────────

const mockFindAll = jest.fn()
const mockCount = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaPromotionRepository", () => ({
  PrismaPromotionRepository: jest.fn().mockImplementation(() => ({
    findAll: mockFindAll,
    count: mockCount,
  })),
}))

import { getPromotions } from "@/application/use-cases/get-promotions"
import type { PromotionFilter } from "@/Interfaces/dto/promotion.dto"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRawPromotion(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Promotion ${id}`,
    type: "AUTOMATIC",
    couponCode: null,
    startsAt: new Date("2026-06-01T00:00:00Z"),
    endsAt: new Date("2026-06-30T23:59:59Z"),
    active: true,
    createdAt: new Date("2026-05-15T10:00:00Z"),
    isDeleted: false,
    conditions: [],
    benefits: [
      {
        id: id * 10,
        discountType: "PERCENTAGE",
        value: 20,
        applyToProductId: null,
        applyToVariantId: null,
        isDeleted: false,
      },
    ],
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("getPromotions use case", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAll.mockResolvedValue([])
    mockCount.mockResolvedValue(0)
  })

  it("calls findAll and count in parallel", async () => {
    await getPromotions()

    expect(mockFindAll).toHaveBeenCalledTimes(1)
    expect(mockCount).toHaveBeenCalledTimes(1)
  })

  it("returns DTOs mapped from raw promotions", async () => {
    const raw = [makeRawPromotion(1), makeRawPromotion(2)]
    mockFindAll.mockResolvedValue(raw)
    mockCount.mockResolvedValue(2)

    const result = await getPromotions()

    expect(result.data).toHaveLength(2)
    expect(result.data[0].id).toBe(1)
    expect(result.data[1].id).toBe(2)
    expect(result.data[0].status).toBeDefined()
    expect(result.data[0].startsAt).toBe("2026-06-01T00:00:00.000Z")
  })

  it("returns total from count", async () => {
    mockCount.mockResolvedValue(42)

    const result = await getPromotions()

    expect(result.total).toBe(42)
  })

  it("defaults page to 1 when filter is undefined", async () => {
    const result = await getPromotions()

    expect(result.page).toBe(1)
  })

  it("defaults page to 1 when filter.page is undefined", async () => {
    const result = await getPromotions({ status: "ACTIVE" })

    expect(result.page).toBe(1)
  })

  it("passes filter to repository", async () => {
    const filter: PromotionFilter = {
      status: "ACTIVE",
      type: "COUPON",
      search: "summer",
      page: 2,
      limit: 10,
    }

    await getPromotions(filter)

    expect(mockFindAll).toHaveBeenCalledWith(filter)
    expect(mockCount).toHaveBeenCalledWith(filter)
  })

  it("returns provided page number", async () => {
    const result = await getPromotions({ page: 3 })

    expect(result.page).toBe(3)
  })

  it("returns empty array when no promotions found", async () => {
    mockFindAll.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    const result = await getPromotions()

    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
  })

  it("propagates repository errors", async () => {
    mockFindAll.mockRejectedValue(new Error("DB connection failed"))

    await expect(getPromotions()).rejects.toThrow("DB connection failed")
  })
})
