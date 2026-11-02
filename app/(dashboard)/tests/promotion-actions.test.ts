// Mock use cases and dependencies BEFORE imports
const mockCreatePromotion = jest.fn()
const mockUpdatePromotion = jest.fn()
const mockDeletePromotion = jest.fn()
const mockTogglePromotion = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}))

jest.mock("@/application/use-cases/create-promotion", () => ({
  createPromotion: mockCreatePromotion,
}))

jest.mock("@/application/use-cases/update-promotion", () => ({
  updatePromotion: mockUpdatePromotion,
}))

jest.mock("@/application/use-cases/delete-promotion", () => ({
  deletePromotion: mockDeletePromotion,
}))

jest.mock("@/application/use-cases/toggle-promotion", () => ({
  togglePromotion: mockTogglePromotion,
}))

import {
  createPromotionAction,
  updatePromotionAction,
  deletePromotionAction,
  togglePromotionAction,
} from "@/app/(dashboard)/actions"

describe("Promotion Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Helpers ──────────────────────────────────────────────────────────────

  function buildPromotionFormData(overrides?: Record<string, string>): FormData {
    const formData = new FormData()
    formData.set("name", "Summer Sale")
    formData.set("type", "AUTOMATIC")
    formData.set(
      "benefits",
      JSON.stringify([{ discountType: "PERCENTAGE", value: 20 }])
    )
    formData.set(
      "conditions",
      JSON.stringify([{ minQuantity: 2 }])
    )
    if (overrides) {
      Object.entries(overrides).forEach(([key, value]) =>
        formData.set(key, value)
      )
    }
    return formData
  }

  // ── createPromotionAction ────────────────────────────────────────────────

  describe("createPromotionAction", () => {
    it("should create promotion on happy path and revalidate", async () => {
      const formData = buildPromotionFormData()
      const dto = {
        id: 1,
        name: "Summer Sale",
        type: "AUTOMATIC",
        status: "ACTIVE",
      }
      mockCreatePromotion.mockResolvedValue(dto)

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(dto)
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/promotions")
    })

    it("should return error when name has fewer than 3 characters", async () => {
      const formData = buildPromotionFormData({ name: "ab" })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/at least 3 characters/)
      expect(mockCreatePromotion).not.toHaveBeenCalled()
    })

    it("should return error when name is empty", async () => {
      const formData = buildPromotionFormData({ name: "" })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/at least 3 characters/)
    })

    it("should return error when name is whitespace only", async () => {
      const formData = buildPromotionFormData({ name: "   " })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/at least 3 characters/)
    })

    it("should return error for invalid promotion type", async () => {
      const formData = buildPromotionFormData({ type: "INVALID" })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Invalid promotion type/)
    })

    it("should return error when type is missing", async () => {
      const formData = buildPromotionFormData({ type: "" })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Invalid promotion type/)
    })

    it("should return error for COUPON type without coupon code", async () => {
      const formData = buildPromotionFormData({ type: "COUPON" })
      // No couponCode set

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Coupon code is required/)
    })

    it("should accept COUPON type with valid coupon code", async () => {
      const formData = buildPromotionFormData({
        type: "COUPON",
        couponCode: "SUMMER20",
      })
      mockCreatePromotion.mockResolvedValue({ id: 1 })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(true)
    })

    it("should return error when endsAt is before startsAt", async () => {
      const formData = buildPromotionFormData({
        startsAt: "2026-06-01",
        endsAt: "2026-01-01",
      })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/End date must be after start date/)
    })

    it("should return error when endsAt equals startsAt", async () => {
      const formData = buildPromotionFormData({
        startsAt: "2026-06-01",
        endsAt: "2026-06-01",
      })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/End date must be after start date/)
    })

    it("should return error when no benefits provided", async () => {
      const formData = buildPromotionFormData({
        benefits: "[]",
      })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/At least one discount benefit/)
    })

    it("should return error for invalid discount type in benefits", async () => {
      const formData = buildPromotionFormData({
        benefits: JSON.stringify([
          { discountType: "BUY_X_GET_Y", value: 10 },
        ]),
      })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Invalid discount type/)
    })

    it("should return error when benefit value is 0", async () => {
      const formData = buildPromotionFormData({
        benefits: JSON.stringify([
          { discountType: "PERCENTAGE", value: 0 },
        ]),
      })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/greater than 0/)
    })

    it("should return error when benefit value is negative", async () => {
      const formData = buildPromotionFormData({
        benefits: JSON.stringify([
          { discountType: "PERCENTAGE", value: -5 },
        ]),
      })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/greater than 0/)
    })

    it("should return error when benefits JSON is malformed", async () => {
      const formData = buildPromotionFormData({
        benefits: "not-valid-json",
      })

      const result = await createPromotionAction(formData)

      // parseJsonArray returns undefined for malformed JSON → defaults to []
      // Then the empty benefits check fires
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/At least one discount benefit/)
    })

    it("should handle use case throwing an error", async () => {
      const formData = buildPromotionFormData()
      mockCreatePromotion.mockRejectedValue(new Error("Duplicate code"))

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Duplicate code")
    })

    it("should handle use case throwing non-Error", async () => {
      const formData = buildPromotionFormData()
      mockCreatePromotion.mockRejectedValue("Unknown error")

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Error creating promotion/)
    })

    it("should handle FIXED discount type", async () => {
      const formData = buildPromotionFormData({
        benefits: JSON.stringify([
          { discountType: "FIXED", value: 5000 },
        ]),
      })
      mockCreatePromotion.mockResolvedValue({ id: 1 })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(true)
    })

    it("should handle decimal precision in benefit value", async () => {
      const formData = buildPromotionFormData({
        benefits: JSON.stringify([
          { discountType: "PERCENTAGE", value: 99.999 },
        ]),
      })
      mockCreatePromotion.mockResolvedValue({ id: 1 })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(true)
      expect(mockCreatePromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          benefits: expect.arrayContaining([
            expect.objectContaining({ value: 99.999 }),
          ]),
        })
      )
    })

    it("should handle unicode characters in name", async () => {
      const formData = buildPromotionFormData({ name: "Oferta Verano Ñandú" })
      mockCreatePromotion.mockResolvedValue({ id: 1 })

      const result = await createPromotionAction(formData)

      expect(result.success).toBe(true)
    })
  })

  // ── updatePromotionAction ────────────────────────────────────────────────

  describe("updatePromotionAction", () => {
    it("should update promotion on happy path and revalidate", async () => {
      const formData = new FormData()
      formData.set("name", "Updated Sale")
      const dto = { id: 1, name: "Updated Sale" }
      mockUpdatePromotion.mockResolvedValue(dto)

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(dto)
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/promotions")
    })

    it("should return error when name has fewer than 3 characters", async () => {
      const formData = new FormData()
      formData.set("name", "ab")

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/at least 3 characters/)
    })

    it("should not validate name when not provided", async () => {
      const formData = new FormData()
      // No name set
      mockUpdatePromotion.mockResolvedValue({ id: 1 })

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(true)
    })

    it("should convert empty couponCode to null (clears code)", async () => {
      const formData = buildPromotionFormData({
        type: "AUTOMATIC",
        couponCode: "",
      })
      mockUpdatePromotion.mockResolvedValue({ id: 1 })

      await updatePromotionAction(1, formData)

      expect(mockUpdatePromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          couponCode: null,
        })
      )
    })

    it("should return error for COUPON type without code during update", async () => {
      const formData = new FormData()
      formData.set("type", "COUPON")
      formData.set("couponCode", "")

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Coupon code is required/)
    })

    it("should return error for invalid discount type during update", async () => {
      const formData = new FormData()
      formData.set(
        "benefits",
        JSON.stringify([{ discountType: "INVALID", value: 10 }])
      )

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Invalid discount type/)
    })

    it("should return error when benefit value is 0 during update", async () => {
      const formData = new FormData()
      formData.set(
        "benefits",
        JSON.stringify([{ discountType: "PERCENTAGE", value: 0 }])
      )

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/greater than 0/)
    })

    it("should return error for invalid date range during update", async () => {
      const formData = new FormData()
      formData.set("startsAt", "2026-06-01")
      formData.set("endsAt", "2026-01-01")

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/End date must be after start date/)
    })

    it("should handle use case error during update", async () => {
      const formData = new FormData()
      formData.set("name", "Updated")
      mockUpdatePromotion.mockRejectedValue(new Error("Not found"))

      const result = await updatePromotionAction(1, formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Not found")
    })
  })

  // ── deletePromotionAction ────────────────────────────────────────────────

  describe("deletePromotionAction", () => {
    it("should delete promotion and revalidate", async () => {
      mockDeletePromotion.mockResolvedValue(undefined)

      const result = await deletePromotionAction(1)

      expect(result.success).toBe(true)
      expect(mockDeletePromotion).toHaveBeenCalledWith(1)
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/promotions")
    })

    it("should return error when delete fails", async () => {
      mockDeletePromotion.mockRejectedValue(new Error("Not found"))

      const result = await deletePromotionAction(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Not found")
    })

    it("should handle non-Error rejection", async () => {
      mockDeletePromotion.mockRejectedValue("Unknown error")

      const result = await deletePromotionAction(1)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Error deleting promotion/)
    })
  })

  // ── togglePromotionAction ────────────────────────────────────────────────

  describe("togglePromotionAction", () => {
    it("should toggle promotion and revalidate", async () => {
      const dto = { id: 1, active: false }
      mockTogglePromotion.mockResolvedValue(dto)

      const result = await togglePromotionAction(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(dto)
      expect(mockTogglePromotion).toHaveBeenCalledWith(1)
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/promotions")
    })

    it("should return error when toggle fails", async () => {
      mockTogglePromotion.mockRejectedValue(new Error("Not found"))

      const result = await togglePromotionAction(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Not found")
    })

    it("should handle non-Error rejection", async () => {
      mockTogglePromotion.mockRejectedValue("Unknown error")

      const result = await togglePromotionAction(1)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Error toggling promotion/)
    })
  })

  // ── Concurrent actions ───────────────────────────────────────────────────

  describe("concurrent action calls", () => {
    it("should handle concurrent toggle calls", async () => {
      mockTogglePromotion.mockResolvedValue({ id: 1, active: true })

      const promises = Array(10)
        .fill(null)
        .map(() => togglePromotionAction(1))

      const results = await Promise.all(promises)

      expect(results.every((r) => r.success)).toBe(true)
      expect(mockTogglePromotion).toHaveBeenCalledTimes(10)
    })
  })
})
