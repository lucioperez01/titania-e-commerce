// ── Mock repository BEFORE importing use case ────────────────────────────────

const mockFindById = jest.fn()
const mockSoftDelete = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaPromotionRepository", () => ({
  PrismaPromotionRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    softDelete: mockSoftDelete,
  })),
}))

import { deletePromotion } from "@/application/use-cases/delete-promotion"

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
    benefits: [],
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("deletePromotion use case", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindById.mockResolvedValue(makeExisting())
    mockSoftDelete.mockResolvedValue(undefined)
  })

  it("throws when promotion does not exist", async () => {
    mockFindById.mockResolvedValue(null)

    await expect(deletePromotion(99)).rejects.toThrow(/Promotion not found/)
    expect(mockSoftDelete).not.toHaveBeenCalled()
  })

  it("calls findById with correct id", async () => {
    await deletePromotion(42)

    expect(mockFindById).toHaveBeenCalledWith(42)
  })

  it("calls softDelete with correct id when promotion exists", async () => {
    await deletePromotion(1)

    expect(mockSoftDelete).toHaveBeenCalledWith(1)
  })

  it("propagates repository errors", async () => {
    mockSoftDelete.mockRejectedValue(new Error("DB error"))

    await expect(deletePromotion(1)).rejects.toThrow("DB error")
  })
})
