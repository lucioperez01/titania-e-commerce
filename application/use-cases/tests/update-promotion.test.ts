// ── Mock repository BEFORE importing use case ────────────────────────────────

const mockFindById = jest.fn()
const mockExistsByCode = jest.fn()
const mockUpdate = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaPromotionRepository", () => ({
  PrismaPromotionRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    existsByCode: mockExistsByCode,
    update: mockUpdate,
  })),
}))

import { updatePromotion } from "@/application/use-cases/update-promotion"
import type { UpdatePromotionInput } from "@/application/use-cases/update-promotion"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeExisting(overrides: Record<string, unknown> = {}) {
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
        discountType: "PERCENTAGE" as const,
        value: 20,
        applyToProductId: null,
        applyToVariantId: null,
        isDeleted: false,
        promotionId: 1,
        createdAt: new Date(),
        deletedAt: null,
      },
    ],
    ...overrides,
  }
}

function makeInput(overrides: Partial<UpdatePromotionInput> = {}): UpdatePromotionInput {
  return {
    id: 1,
    name: "Updated Sale",
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("updatePromotion use case", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindById.mockResolvedValue(makeExisting())
    mockExistsByCode.mockResolvedValue(false)
    mockUpdate.mockImplementation(async (_id: number, data: unknown) =>
      makeExisting(data as Record<string, unknown>)
    )
  })

  describe("not found", () => {
    it("throws when promotion does not exist", async () => {
      mockFindById.mockResolvedValue(null)

      await expect(updatePromotion(makeInput())).rejects.toThrow(/Promotion not found/)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe("coupon code handling", () => {
    it("normalizes couponCode to uppercase + trimmed", async () => {
      await updatePromotion(makeInput({ couponCode: "  verano20  " }))

      expect(mockExistsByCode).toHaveBeenCalledWith("VERANO20", 1)
      const updateArg = mockUpdate.mock.calls[0][1]
      expect(updateArg.couponCode).toBe("VERANO20")
    })

    it("throws when normalized code already exists for another promotion", async () => {
      mockExistsByCode.mockResolvedValue(true)

      await expect(
        updatePromotion(makeInput({ couponCode: "DUPE" }))
      ).rejects.toThrow(/Code already exists/)

      expect(mockExistsByCode).toHaveBeenCalledWith("DUPE", 1)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it("sets couponCode to null when explicitly null (clears code)", async () => {
      await updatePromotion(makeInput({ couponCode: null }))

      // Should NOT call existsByCode when clearing
      expect(mockExistsByCode).not.toHaveBeenCalled()
      const updateArg = mockUpdate.mock.calls[0][1]
      expect(updateArg.couponCode).toBeNull()
    })

    it("skips code update when couponCode is undefined", async () => {
      await updatePromotion(makeInput({ couponCode: undefined }))

      expect(mockExistsByCode).not.toHaveBeenCalled()
      const updateArg = mockUpdate.mock.calls[0][1]
      expect(updateArg.couponCode).toBeUndefined()
    })
  })

  describe("date validation", () => {
    it("throws when endsAt <= startsAt", async () => {
      await expect(
        updatePromotion(
          makeInput({
            startsAt: "2026-06-15T00:00:00Z",
            endsAt: "2026-06-15T00:00:00Z",
          })
        )
      ).rejects.toThrow(/End date must be after start date/)

      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it("allows null startsAt", async () => {
      await updatePromotion(makeInput({ startsAt: null }))

      const updateArg = mockUpdate.mock.calls[0][1]
      expect(updateArg.startsAt).toBeNull()
    })

    it("allows null endsAt (never expires)", async () => {
      await updatePromotion(makeInput({ endsAt: null }))

      const updateArg = mockUpdate.mock.calls[0][1]
      expect(updateArg.endsAt).toBeNull()
    })
  })

  describe("effectiveBenefits fallback", () => {
    it("uses existing non-deleted benefits when input.benefits is undefined", async () => {
      const existing = makeExisting({
        benefits: [
          { id: 1, discountType: "PERCENTAGE", value: 20, applyToProductId: null, applyToVariantId: null, isDeleted: false, promotionId: 1, createdAt: new Date(), deletedAt: null },
          { id: 2, discountType: "FIXED", value: 100, applyToProductId: null, applyToVariantId: null, isDeleted: true, promotionId: 1, createdAt: new Date(), deletedAt: new Date() },
        ],
      })
      mockFindById.mockResolvedValue(existing)

      await updatePromotion(makeInput({ benefits: undefined }))

      // Should not throw because existing has 1 non-deleted benefit
      expect(mockUpdate).toHaveBeenCalled()
    })

    it("throws when input.benefits is empty and existing has no non-deleted benefits", async () => {
      const existing = makeExisting({
        benefits: [
          { id: 1, discountType: "PERCENTAGE", value: 20, applyToProductId: null, applyToVariantId: null, isDeleted: true, promotionId: 1, createdAt: new Date(), deletedAt: new Date() },
        ],
      })
      mockFindById.mockResolvedValue(existing)

      await expect(
        updatePromotion(makeInput({ benefits: undefined }))
      ).rejects.toThrow(/At least one discount benefit is required/)
    })

    it("validates provided benefits even if existing has valid ones", async () => {
      await expect(
        updatePromotion(makeInput({ benefits: [] }))
      ).rejects.toThrow(/At least one discount benefit is required/)
    })
  })

  describe("partial update data building", () => {
    it("only includes defined fields in update data", async () => {
      await updatePromotion({ id: 1, name: "New Name" })

      const updateArg = mockUpdate.mock.calls[0][1]
      expect(updateArg.name).toBe("New Name")
      expect(updateArg.type).toBeUndefined()
      expect(updateArg.couponCode).toBeUndefined()
      expect(updateArg.startsAt).toBeUndefined()
      expect(updateArg.endsAt).toBeUndefined()
      expect(updateArg.conditions).toBeUndefined()
      expect(updateArg.benefits).toBeUndefined()
    })

    it("converts string dates to Date objects", async () => {
      await updatePromotion(
        makeInput({
          startsAt: "2026-07-01T00:00:00Z",
          endsAt: "2026-07-31T23:59:59Z",
        })
      )

      const updateArg = mockUpdate.mock.calls[0][1]
      expect(updateArg.startsAt).toEqual(new Date("2026-07-01T00:00:00Z"))
      expect(updateArg.endsAt).toEqual(new Date("2026-07-31T23:59:59Z"))
    })
  })

  describe("happy path", () => {
    it("returns DTO on successful update", async () => {
      const result = await updatePromotion(makeInput())

      expect(mockFindById).toHaveBeenCalledWith(1)
      expect(mockUpdate).toHaveBeenCalledTimes(1)
      expect(result.id).toBe(1)
      expect(result.name).toBeDefined()
      expect(result.status).toBeDefined()
    })
  })
})
