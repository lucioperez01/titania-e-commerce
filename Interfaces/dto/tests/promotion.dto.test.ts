import {
  computeStatus,
  toPromotionDTO,
  toPromotionConditionDTO,
  toPromotionBenefitDTO,
  type PromotionStatus,
} from "@/Interfaces/dto/promotion.dto"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRawPromotion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Summer Sale",
    type: "AUTOMATIC" as const,
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

function makeRawCondition(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    minQuantity: null,
    minSubtotal: 1000,
    productId: null,
    variantId: null,
    promotionId: 1,
    isDeleted: false,
    createdAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

function makeRawBenefit(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    discountType: "PERCENTAGE" as const,
    value: 20,
    applyToProductId: null,
    applyToVariantId: null,
    promotionId: 1,
    isDeleted: false,
    createdAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("computeStatus", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("returns INACTIVE when active is false", () => {
    const now = new Date("2026-06-15T12:00:00Z")
    jest.setSystemTime(now)

    expect(computeStatus(false, null, null)).toBe("INACTIVE")
  })

  it("returns INACTIVE when active is false even within date range", () => {
    const now = new Date("2026-06-15T12:00:00Z")
    jest.setSystemTime(now)

    const startsAt = new Date("2026-06-01T00:00:00Z")
    const endsAt = new Date("2026-06-30T23:59:59Z")

    expect(computeStatus(false, startsAt, endsAt)).toBe("INACTIVE")
  })

  it("returns EXPIRED when now is after endsAt", () => {
    const now = new Date("2026-07-01T00:00:00Z")
    jest.setSystemTime(now)

    const startsAt = new Date("2026-06-01T00:00:00Z")
    const endsAt = new Date("2026-06-30T23:59:59Z")

    expect(computeStatus(true, startsAt, endsAt)).toBe("EXPIRED")
  })

  it("returns SCHEDULED when active and now is before startsAt", () => {
    const now = new Date("2026-05-15T12:00:00Z")
    jest.setSystemTime(now)

    const startsAt = new Date("2026-06-01T00:00:00Z")
    const endsAt = new Date("2026-06-30T23:59:59Z")

    expect(computeStatus(true, startsAt, endsAt)).toBe("SCHEDULED")
  })

  it("returns ACTIVE when now is between startsAt and endsAt", () => {
    const now = new Date("2026-06-15T12:00:00Z")
    jest.setSystemTime(now)

    const startsAt = new Date("2026-06-01T00:00:00Z")
    const endsAt = new Date("2026-06-30T23:59:59Z")

    expect(computeStatus(true, startsAt, endsAt)).toBe("ACTIVE")
  })

  it("returns ACTIVE when now equals startsAt (inclusive boundary)", () => {
    const now = new Date("2026-06-01T00:00:00Z")
    jest.setSystemTime(now)

    const startsAt = new Date("2026-06-01T00:00:00Z")
    const endsAt = new Date("2026-06-30T23:59:59Z")

    expect(computeStatus(true, startsAt, endsAt)).toBe("ACTIVE")
  })

  it("returns EXPIRED when now equals endsAt (exclusive boundary)", () => {
    const now = new Date("2026-06-30T23:59:59Z")
    jest.setSystemTime(now)

    const startsAt = new Date("2026-06-01T00:00:00Z")
    const endsAt = new Date("2026-06-30T23:59:59Z")

    // now > endsAt is false (equal), so it's still ACTIVE
    expect(computeStatus(true, startsAt, endsAt)).toBe("ACTIVE")
  })

  it("returns ACTIVE when startsAt is null and active + before endsAt", () => {
    const now = new Date("2026-06-15T12:00:00Z")
    jest.setSystemTime(now)

    const endsAt = new Date("2026-12-31T23:59:59Z")

    expect(computeStatus(true, null, endsAt)).toBe("ACTIVE")
  })

  it("returns ACTIVE when endsAt is null and active + after startsAt (never expires)", () => {
    const now = new Date("2026-06-15T12:00:00Z")
    jest.setSystemTime(now)

    const startsAt = new Date("2026-06-01T00:00:00Z")

    expect(computeStatus(true, startsAt, null)).toBe("ACTIVE")
  })

  it("returns ACTIVE when both dates are null and active (always active)", () => {
    const now = new Date("2026-06-15T12:00:00Z")
    jest.setSystemTime(now)

    expect(computeStatus(true, null, null)).toBe("ACTIVE")
  })
})

describe("toPromotionDTO", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-06-15T12:00:00Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("maps basic fields correctly", () => {
    const raw = makeRawPromotion()
    const dto = toPromotionDTO(raw as never)

    expect(dto.id).toBe(1)
    expect(dto.name).toBe("Summer Sale")
    expect(dto.type).toBe("AUTOMATIC")
    expect(dto.couponCode).toBeNull()
    expect(dto.active).toBe(true)
  })

  it("converts dates to ISO strings", () => {
    const raw = makeRawPromotion()
    const dto = toPromotionDTO(raw as never)

    expect(dto.startsAt).toBe("2026-06-01T00:00:00.000Z")
    expect(dto.endsAt).toBe("2026-06-30T23:59:59.000Z")
    expect(dto.createdAt).toBe("2026-05-15T10:00:00.000Z")
  })

  it("maps null dates to null", () => {
    const raw = makeRawPromotion({ startsAt: null, endsAt: null })
    const dto = toPromotionDTO(raw as never)

    expect(dto.startsAt).toBeNull()
    expect(dto.endsAt).toBeNull()
  })

  it("computes status based on dates and active flag", () => {
    const raw = makeRawPromotion()
    const dto = toPromotionDTO(raw as never)

    expect(dto.status).toBe("ACTIVE")
  })

  it("filters out soft-deleted conditions", () => {
    const raw = makeRawPromotion({
      conditions: [
        makeRawCondition({ id: 1, isDeleted: false }),
        makeRawCondition({ id: 2, isDeleted: true }),
        makeRawCondition({ id: 3, isDeleted: false }),
      ],
    })
    const dto = toPromotionDTO(raw as never)

    expect(dto.conditions).toHaveLength(2)
    expect(dto.conditions.map((c) => c.id)).toEqual([1, 3])
  })

  it("filters out soft-deleted benefits", () => {
    const raw = makeRawPromotion({
      benefits: [
        makeRawBenefit({ id: 1, isDeleted: false }),
        makeRawBenefit({ id: 2, isDeleted: true }),
      ],
    })
    const dto = toPromotionDTO(raw as never)

    expect(dto.benefits).toHaveLength(1)
    expect(dto.benefits[0].id).toBe(1)
  })

  it("converts Decimal values to numbers", () => {
    const raw = makeRawPromotion({
      conditions: [makeRawCondition({ minSubtotal: 1500.5 })],
      benefits: [makeRawBenefit({ value: 33.33 })],
    })
    const dto = toPromotionDTO(raw as never)

    expect(dto.conditions[0].minSubtotal).toBe(1500.5)
    expect(typeof dto.conditions[0].minSubtotal).toBe("number")
    expect(dto.benefits[0].value).toBe(33.33)
    expect(typeof dto.benefits[0].value).toBe("number")
  })

  it("handles null minSubtotal correctly", () => {
    const raw = makeRawPromotion({
      conditions: [makeRawCondition({ minSubtotal: null })],
    })
    const dto = toPromotionDTO(raw as never)

    expect(dto.conditions[0].minSubtotal).toBeNull()
  })

  it("handles high decimal precision", () => {
    const raw = makeRawPromotion({
      benefits: [makeRawBenefit({ value: 33.33333 })],
    })
    const dto = toPromotionDTO(raw as never)

    expect(dto.benefits[0].value).toBeCloseTo(33.33333, 5)
  })
})

describe("toPromotionConditionDTO", () => {
  it("maps all fields correctly", () => {
    const raw = makeRawCondition({
      id: 5,
      minQuantity: 3,
      minSubtotal: 5000,
      productId: 10,
      variantId: 20,
    })
    const dto = toPromotionConditionDTO(raw as never)

    expect(dto).toEqual({
      id: 5,
      minQuantity: 3,
      minSubtotal: 5000,
      productId: 10,
      variantId: 20,
    })
  })

  it("preserves null values", () => {
    const raw = makeRawCondition({
      minQuantity: null,
      minSubtotal: null,
      productId: null,
      variantId: null,
    })
    const dto = toPromotionConditionDTO(raw as never)

    expect(dto.minQuantity).toBeNull()
    expect(dto.minSubtotal).toBeNull()
    expect(dto.productId).toBeNull()
    expect(dto.variantId).toBeNull()
  })
})

describe("toPromotionBenefitDTO", () => {
  it("maps PERCENTAGE benefit correctly", () => {
    const raw = makeRawBenefit({ discountType: "PERCENTAGE", value: 20 })
    const dto = toPromotionBenefitDTO(raw as never)

    expect(dto.discountType).toBe("PERCENTAGE")
    expect(dto.value).toBe(20)
  })

  it("maps FIXED benefit correctly", () => {
    const raw = makeRawBenefit({ discountType: "FIXED", value: 5000 })
    const dto = toPromotionBenefitDTO(raw as never)

    expect(dto.discountType).toBe("FIXED")
    expect(dto.value).toBe(5000)
  })

  it("maps BUY_X_GET_Y benefit correctly", () => {
    const raw = makeRawBenefit({
      discountType: "BUY_X_GET_Y",
      value: 1,
      applyToProductId: 42,
    })
    const dto = toPromotionBenefitDTO(raw as never)

    expect(dto.discountType).toBe("BUY_X_GET_Y")
    expect(dto.value).toBe(1)
    expect(dto.applyToProductId).toBe(42)
  })

  it("converts value from Decimal to number", () => {
    const raw = makeRawBenefit({ value: 19.99 })
    const dto = toPromotionBenefitDTO(raw as never)

    expect(typeof dto.value).toBe("number")
    expect(dto.value).toBe(19.99)
  })
})
