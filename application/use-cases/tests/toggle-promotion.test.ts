// ── Mock repository BEFORE importing use case ────────────────────────────────

const mockFindById = jest.fn()
const mockToggleActive = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaPromotionRepository", () => ({
  PrismaPromotionRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    toggleActive: mockToggleActive,
  })),
}))

import { togglePromotion } from "@/application/use-cases/toggle-promotion"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeExisting() {
  return {
    id: 1,
    name: "Summer Sale",
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
        id: 1,
        discountType: "PERCENTAGE",
        value: 20,
        applyToProductId: null,
        applyToVariantId: null,
        isDeleted: false,
      },
    ],
  }
}

function makeToggled() {
  return {
    ...makeExisting(),
    active: false,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("togglePromotion use case", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindById.mockResolvedValue(makeExisting())
    mockToggleActive.mockResolvedValue(makeToggled())
  })

  it("throws when promotion does not exist", async () => {
    mockFindById.mockResolvedValue(null)

    await expect(togglePromotion(99)).rejects.toThrow(/Promotion not found/)
    expect(mockToggleActive).not.toHaveBeenCalled()
  })

  it("calls findById with correct id", async () => {
    await togglePromotion(42)

    expect(mockFindById).toHaveBeenCalledWith(42)
  })

  it("calls toggleActive with correct id", async () => {
    await togglePromotion(1)

    expect(mockToggleActive).toHaveBeenCalledWith(1)
  })

  it("returns DTO with toggled active status", async () => {
    const result = await togglePromotion(1)

    expect(result.id).toBe(1)
    expect(result.active).toBe(false)
    expect(result.status).toBeDefined()
  })

  it("propagates repository errors", async () => {
    mockToggleActive.mockRejectedValue(new Error("DB error"))

    await expect(togglePromotion(1)).rejects.toThrow("DB error")
  })
})
