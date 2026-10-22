type PromotionConditionProps = {
  id?: number
  minQuantity: number | null
  minSubtotal: number | null
  productId: number | null
  variantId: number | null
}

type PromotionBenefitProps = {
  id?: number
  discountType: "PERCENTAGE" | "FIXED" | "BUY_X_GET_Y"
  value: number
  applyToProductId: number | null
  applyToVariantId: number | null
}

type PromotionProps = {
  id: number
  name: string
  type: "COUPON" | "AUTOMATIC"
  couponCode: string | null
  startsAt: Date | null
  endsAt: Date | null
  active: boolean
  conditions: PromotionConditionProps[]
  benefits: PromotionBenefitProps[]
  createdAt?: Date
}

export class Promotion {
  public readonly id: number
  public readonly name: string
  public readonly type: "COUPON" | "AUTOMATIC"
  public couponCode: string | null
  public startsAt: Date | null
  public endsAt: Date | null
  public active: boolean
  public conditions: PromotionConditionProps[]
  public benefits: PromotionBenefitProps[]
  public readonly createdAt: Date

  constructor(props: PromotionProps) {
    this.id = props.id
    this.name = props.name
    this.type = props.type
    this.couponCode = props.couponCode
    this.startsAt = props.startsAt
    this.endsAt = props.endsAt
    this.active = props.active
    this.conditions = props.conditions
    this.benefits = props.benefits
    this.createdAt = props.createdAt ?? new Date()
  }

  /**
   * Basic structural validation — ensures required fields are present
   * and date range is coherent. Does NOT check business rules like
   * code uniqueness (that belongs in the use-case layer).
   */
  isValid(): boolean {
    if (!this.name || this.name.trim().length === 0) return false

    if (this.type === "COUPON" && !this.couponCode) return false

    if (this.benefits.length === 0) return false

    if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) return false

    return true
  }

  /**
   * Date-aware active check. Returns true only when the promotion
   * is marked active AND the current time falls within the date range.
   */
  isActive(now: Date = new Date()): boolean {
    if (!this.active) return false
    if (this.startsAt && now < this.startsAt) return false
    if (this.endsAt && now > this.endsAt) return false
    return true
  }
}
