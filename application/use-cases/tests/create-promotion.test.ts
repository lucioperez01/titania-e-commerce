// ── Mock repository BEFORE importing use case ────────────────────────────────

const mockExistsByCode = jest.fn()
const mockCreate = jest.fn()

jest.mock("@/infrastructure/repositories/PrismaPromotionRepository", () => ({
  PrismaPromotionRepository: jest.fn().mockImplementation(() => ({
    existsByCode: mockExistsByCode,
    create: mockCreate,
  })),
}))

import { createPromotion } from "@/application/use-cases/create-promotion"
import type { CreatePromotionInput } from "@/Interfaces/dto/promotion.dto"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<CreatePromotionInput> = {}): CreatePromotionInput {
  return {
    name: "Summer Sale",
    type: "AUTOMATIC",
    couponCode: undefined,
    startsAt: "2026-06-01T00:00:00Z",
    endsAt: "2026-06-30T23:59:59Z",
    conditions: [],
    benefits: [{ discountType: "PERCENTAGE", value: 20 }],
    ...overrides,
  }
}

function makeCreatedPromotion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Summer Sale",
    type: "AUTOMATIC",
    couponCode: null,
    startsAt: new Date("2026-06-01T00:00:00Z"),
    endsAt: new Date("2026-06-30T23:59:59Z"),
    active: true,
    createdAt: new Date("2026-05-15T10:00:00Z"),
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
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("createPromotion use case", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExistsByCode.mockResolvedValue(false)
    mockCreate.mockImplementation(async (data: unknown) =>
      makeCreatedPromotion(data as Record<string, unknown>)
    )
  })

  describe("coupon code normalization", () => {
    it("normalizes couponCode to uppercase + trimmed", async () => {
      await createPromotion(makeInput({ type: "COUPON", couponCode: "  verano20  " }))

      expect(mockExistsByCode).toHaveBeenCalledWith("VERANO20")
      const createArg = mockCreate.mock.calls[0][0]
      expect(createArg.couponCode).toBe("VERANO20")
    })

    it("sets couponCode to null when not provided", async () => {
      await createPromotion(makeInput({ couponCode: undefined }))

      const createArg = mockCreate.mock.calls[0][0]
      expect(createArg.couponCode).toBeNull()
      expect(mockExistsByCode).not.toHaveBeenCalled()
    })
  })

  describe("code uniqueness validation", () => {
    it("throws when coupon code already exists", async () => {
      mockExistsByCode.mockResolvedValue(true)

      await expect(
        createPromotion(makeInput({ type: "COUPON", couponCode: "DUPE" }))
      ).rejects.toThrow(/Code already exists/)

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it("is case-insensitive (already normalized before check)", async () => {
      mockExistsByCode.mockResolvedValue(true)

      await expect(
        createPromotion(makeInput({ type: "COUPON", couponCode: "summer20" }))
      ).rejects.toThrow(/Code already exists/)

      expect(mockExistsByCode).toHaveBeenCalledWith("SUMMER20")
    })
  })

  describe("date validation", () => {
    it("throws when endsAt <= startsAt", async () => {
      await expect(
        createPromotion(
          makeInput({
            startsAt: "2026-06-15T00:00:00Z",
            endsAt: "2026-06-15T00:00:00Z",
          })
        )
      ).rejects.toThrow(/End date must be after start date/)

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it("throws when endsAt is before startsAt", async () => {
      await expect(
        createPromotion(
          makeInput({
            startsAt: "2026-06-30T00:00:00Z",
            endsAt: "2026-06-01T00:00:00Z",
          })
        )
      ).rejects.toThrow(/End date must be after start date/)
    })

    it("allows null startsAt (no start date constraint)", async () => {
      await createPromotion(makeInput({ startsAt: null }))

      const createArg = mockCreate.mock.calls[0][0]
      expect(createArg.startsAt).toBeNull()
      expect(mockCreate).toHaveBeenCalled()
    })

    it("allows null endsAt (never expires)", async () => {
      await createPromotion(makeInput({ endsAt: null }))

      const createArg = mockCreate.mock.calls[0][0]
      expect(createArg.endsAt).toBeNull()
      expect(mockCreate).toHaveBeenCalled()
    })
  })

  describe("benefits validation", () => {
    it("throws when benefits array is empty", async () => {
      await expect(
        createPromotion(makeInput({ benefits: [] }))
      ).rejects.toThrow(/At least one discount benefit is required/)

      expect(mockCreate).not.toHaveBeenCalled()
    })
  })

  describe("happy path", () => {
    it("creates promotion with correct data and returns DTO", async () => {
      const input = makeInput({ type: "COUPON", couponCode: "save10" })
      const result = await createPromotion(input)

      const createArg = mockCreate.mock.calls[0][0]
      expect(createArg.name).toBe("Summer Sale")
      expect(createArg.type).toBe("COUPON")
      expect(createArg.couponCode).toBe("SAVE10")
      expect(createArg.startsAt).toBeInstanceOf(Date)
      expect(createArg.endsAt).toBeInstanceOf(Date)
      expect(createArg.conditions).toEqual([])
      expect(createArg.benefits).toEqual([{ discountType: "PERCENTAGE", value: 20 }])

      // Returns DTO shape
      expect(result.id).toBe(1)
      expect(result.name).toBe("Summer Sale")
      expect(result.status).toBeDefined()
      expect(result.benefits).toHaveLength(1)
    })

    it("converts string dates to Date objects", async () => {
      await createPromotion(makeInput())

      const createArg = mockCreate.mock.calls[0][0]
      expect(createArg.startsAt).toEqual(new Date("2026-06-01T00:00:00Z"))
      expect(createArg.endsAt).toEqual(new Date("2026-06-30T23:59:59Z"))
    })
  })

  describe("repository errors", () => {
    it("propagates repository create errors", async () => {
      mockCreate.mockRejectedValue(new Error("DB connection failed"))

      await expect(createPromotion(makeInput())).rejects.toThrow("DB connection failed")
    })
  })
})
