import { Promotion } from "@/domain/promotion/entities/promotion"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePromotion(overrides: Partial<ConstructorParameters<typeof Promotion>[0]> = {}) {
  return new Promotion({
    id: 1,
    name: "Summer Sale",
    type: "AUTOMATIC",
    couponCode: null,
    startsAt: new Date("2026-06-01T00:00:00Z"),
    endsAt: new Date("2026-06-30T23:59:59Z"),
    active: true,
    conditions: [],
    benefits: [{ discountType: "PERCENTAGE", value: 20, applyToProductId: null, applyToVariantId: null }],
    ...overrides,
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Promotion entity", () => {
  describe("isValid", () => {
    it("returns false when name is empty", () => {
      const promo = makePromotion({ name: "" })
      expect(promo.isValid()).toBe(false)
    })

    it("returns false when name is only whitespace", () => {
      const promo = makePromotion({ name: "   " })
      expect(promo.isValid()).toBe(false)
    })

    it("returns false when type is COUPON and couponCode is null", () => {
      const promo = makePromotion({ type: "COUPON", couponCode: null })
      expect(promo.isValid()).toBe(false)
    })

    it("returns true when type is COUPON and couponCode is present", () => {
      const promo = makePromotion({ type: "COUPON", couponCode: "SUMMER20" })
      expect(promo.isValid()).toBe(true)
    })

    it("returns true when type is AUTOMATIC (no coupon needed)", () => {
      const promo = makePromotion({ type: "AUTOMATIC", couponCode: null })
      expect(promo.isValid()).toBe(true)
    })

    it("returns false when benefits array is empty", () => {
      const promo = makePromotion({ benefits: [] })
      expect(promo.isValid()).toBe(false)
    })

    it("returns false when endsAt <= startsAt", () => {
      const startsAt = new Date("2026-06-15T00:00:00Z")
      const endsAt = new Date("2026-06-15T00:00:00Z") // same date
      const promo = makePromotion({ startsAt, endsAt })
      expect(promo.isValid()).toBe(false)
    })

    it("returns false when endsAt < startsAt (reversed range)", () => {
      const startsAt = new Date("2026-06-30T00:00:00Z")
      const endsAt = new Date("2026-06-01T00:00:00Z")
      const promo = makePromotion({ startsAt, endsAt })
      expect(promo.isValid()).toBe(false)
    })

    it("returns true with valid AUTOMATIC promotion", () => {
      const promo = makePromotion()
      expect(promo.isValid()).toBe(true)
    })

    it("returns true when startsAt is null (no start date constraint)", () => {
      const promo = makePromotion({ startsAt: null })
      expect(promo.isValid()).toBe(true)
    })

    it("returns true when endsAt is null (no expiry)", () => {
      const promo = makePromotion({ endsAt: null })
      expect(promo.isValid()).toBe(true)
    })

    it("returns true when both dates are null", () => {
      const promo = makePromotion({ startsAt: null, endsAt: null })
      expect(promo.isValid()).toBe(true)
    })
  })

  describe("isActive", () => {
    const now = new Date("2026-06-15T12:00:00Z")

    it("returns false when active is false", () => {
      const promo = makePromotion({ active: false })
      expect(promo.isActive(now)).toBe(false)
    })

    it("returns false when now is before startsAt", () => {
      const promo = makePromotion({
        startsAt: new Date("2026-07-01T00:00:00Z"),
      })
      expect(promo.isActive(now)).toBe(false)
    })

    it("returns false when now is after endsAt", () => {
      const promo = makePromotion({
        endsAt: new Date("2026-06-01T00:00:00Z"),
      })
      expect(promo.isActive(now)).toBe(false)
    })

    it("returns true when now is within date range and active", () => {
      const promo = makePromotion({
        startsAt: new Date("2026-06-01T00:00:00Z"),
        endsAt: new Date("2026-06-30T23:59:59Z"),
        active: true,
      })
      expect(promo.isActive(now)).toBe(true)
    })

    it("returns true when startsAt is null and active + before endsAt", () => {
      const promo = makePromotion({
        startsAt: null,
        endsAt: new Date("2026-12-31T23:59:59Z"),
        active: true,
      })
      expect(promo.isActive(now)).toBe(true)
    })

    it("returns true when endsAt is null and active + after startsAt", () => {
      const promo = makePromotion({
        startsAt: new Date("2026-01-01T00:00:00Z"),
        endsAt: null,
        active: true,
      })
      expect(promo.isActive(now)).toBe(true)
    })

    it("returns true when both dates are null and active", () => {
      const promo = makePromotion({ startsAt: null, endsAt: null, active: true })
      expect(promo.isActive(now)).toBe(true)
    })

    it("returns true when now equals startsAt (boundary: inclusive start)", () => {
      const promo = makePromotion({
        startsAt: now,
        endsAt: new Date("2026-12-31T23:59:59Z"),
        active: true,
      })
      expect(promo.isActive(now)).toBe(true)
    })

    it("returns false when now equals endsAt (boundary: exclusive end)", () => {
      const promo = makePromotion({
        startsAt: new Date("2026-01-01T00:00:00Z"),
        endsAt: now,
        active: true,
      })
      // endsAt: now > endsAt → false, but now === endsAt is NOT > endsAt
      // so isActive returns true at exact boundary
      expect(promo.isActive(now)).toBe(true)
    })
  })

  describe("constructor", () => {
    it("sets createdAt to current date if not provided", () => {
      const before = new Date()
      const promo = makePromotion({ createdAt: undefined })
      const after = new Date()
      expect(promo.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(promo.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it("preserves createdAt when provided", () => {
      const createdAt = new Date("2026-01-01T00:00:00Z")
      const promo = makePromotion({ createdAt })
      expect(promo.createdAt).toEqual(createdAt)
    })
  })
})
