import { prisma } from "../db/prismaClient"
import {
  PromotionRepository,
  FindAllOptions,
  CreatePromotionData,
  UpdatePromotionData,
} from "@/domain/promotion/repositories/promotion-repository"
import { Prisma } from "@prisma/client"

type PromotionWithRelations = Prisma.PromotionGetPayload<{
  include: { conditions: true; benefits: true }
}>

export class PrismaPromotionRepository implements PromotionRepository {
  // ── WHERE builder (shared by findAll & count) ────────────────────────────

  private buildWhere(options?: FindAllOptions): Prisma.PromotionWhereInput {
    const now = new Date()
    const conditions: Prisma.PromotionWhereInput[] = [{ isDeleted: false }]

    // ── Status filter (date-aware) ───────────────────────────────────────
    if (options?.status && options.status !== "ALL") {
      switch (options.status) {
        case "ACTIVE":
          conditions.push({
            active: true,
            startsAt: { lte: now },
            OR: [
              { endsAt: { gte: now } },
              { endsAt: null },
            ],
          })
          break
        case "EXPIRED":
          conditions.push({ endsAt: { lt: now } })
          break
        case "SCHEDULED":
          conditions.push({ startsAt: { gt: now } })
          break
        case "INACTIVE":
          conditions.push({ active: false })
          break
      }
    }

    // ── Type filter ──────────────────────────────────────────────────────
    if (options?.type) {
      conditions.push({ type: options.type })
    }

    // ── Search (code or name contains) ───────────────────────────────────
    if (options?.search) {
      conditions.push({
        OR: [
          { name: { contains: options.search, mode: "insensitive" } },
          { couponCode: { contains: options.search, mode: "insensitive" } },
        ],
      })
    }

    return { AND: conditions }
  }

  // ── findAll ──────────────────────────────────────────────────────────────

  async findAll(options?: FindAllOptions): Promise<PromotionWithRelations[]> {
    const where = this.buildWhere(options)

    // ── Pagination ───────────────────────────────────────────────────────
    const page = options?.page ?? 1
    const limit = options?.limit ?? 50
    const skip = (page - 1) * limit

    return prisma.promotion.findMany({
      where,
      include: { conditions: true, benefits: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })
  }

  // ── count ────────────────────────────────────────────────────────────────

  async count(options?: FindAllOptions): Promise<number> {
    const where = this.buildWhere(options)
    return prisma.promotion.count({ where })
  }

  // ── findById ─────────────────────────────────────────────────────────────

  async findById(id: number): Promise<PromotionWithRelations | null> {
    return prisma.promotion.findFirst({
      where: { id, isDeleted: false },
      include: { conditions: true, benefits: true },
    })
  }

  // ── create (atomic transaction) ──────────────────────────────────────────

  async create(data: CreatePromotionData): Promise<PromotionWithRelations> {
    return prisma.$transaction(async (tx) => {
      const promotion = await tx.promotion.create({
        data: {
          name: data.name,
          type: data.type,
          couponCode: data.couponCode,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          active: data.active ?? true,
          conditions: {
            create: data.conditions.map((c) => ({
              minQuantity: c.minQuantity ?? null,
              minSubtotal: c.minSubtotal ?? null,
              productId: c.productId ?? null,
              variantId: c.variantId ?? null,
            })),
          },
          benefits: {
            create: data.benefits.map((b) => ({
              discountType: b.discountType,
              value: b.value,
              applyToProductId: b.applyToProductId ?? null,
              applyToVariantId: b.applyToVariantId ?? null,
            })),
          },
        },
        include: { conditions: true, benefits: true },
      })

      return promotion
    })
  }

  // ── update (atomic transaction) ──────────────────────────────────────────

  async update(
    id: number,
    data: UpdatePromotionData
  ): Promise<PromotionWithRelations> {
    return prisma.$transaction(async (tx) => {
      // ── Update promotion scalar fields ───────────────────────────────
      const promotionData: Prisma.PromotionUpdateInput = {}

      if (data.name !== undefined) promotionData.name = data.name
      if (data.type !== undefined) promotionData.type = data.type
      if (data.couponCode !== undefined) promotionData.couponCode = data.couponCode
      if (data.startsAt !== undefined) promotionData.startsAt = data.startsAt
      if (data.endsAt !== undefined) promotionData.endsAt = data.endsAt
      if (data.active !== undefined) promotionData.active = data.active

      await tx.promotion.update({
        where: { id, isDeleted: false },
        data: promotionData,
      })

      // ── Replace conditions (soft-delete old, create new) ─────────────
      if (data.conditions !== undefined) {
        await tx.promotionCondition.updateMany({
          where: { promotionId: id, isDeleted: false },
          data: { isDeleted: true, deletedAt: new Date() },
        })

        if (data.conditions.length > 0) {
          await tx.promotionCondition.createMany({
            data: data.conditions.map((c) => ({
              promotionId: id,
              minQuantity: c.minQuantity ?? null,
              minSubtotal: c.minSubtotal ?? null,
              productId: c.productId ?? null,
              variantId: c.variantId ?? null,
            })),
          })
        }
      }

      // ── Replace benefits (soft-delete old, create new) ───────────────
      if (data.benefits !== undefined) {
        await tx.promotionBenefit.updateMany({
          where: { promotionId: id, isDeleted: false },
          data: { isDeleted: true, deletedAt: new Date() },
        })

        if (data.benefits.length > 0) {
          await tx.promotionBenefit.createMany({
            data: data.benefits.map((b) => ({
              promotionId: id,
              discountType: b.discountType,
              value: b.value,
              applyToProductId: b.applyToProductId ?? null,
              applyToVariantId: b.applyToVariantId ?? null,
            })),
          })
        }
      }

      // ── Return updated promotion with relations ──────────────────────
      const updated = await tx.promotion.findUnique({
        where: { id },
        include: { conditions: true, benefits: true },
      })

      if (!updated) {
        throw new Error(`Promotion ${id} not found after update`)
      }

      return updated
    })
  }

  // ── softDelete ───────────────────────────────────────────────────────────

  async softDelete(id: number): Promise<void> {
    await prisma.promotion.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    })
  }

  // ── toggleActive ─────────────────────────────────────────────────────────

  async toggleActive(id: number): Promise<PromotionWithRelations> {
    const promotion = await prisma.promotion.findFirst({
      where: { id, isDeleted: false },
      select: { active: true },
    })

    if (!promotion) {
      throw new Error(`Promotion ${id} not found`)
    }

    return prisma.promotion.update({
      where: { id },
      data: { active: !promotion.active },
      include: { conditions: true, benefits: true },
    })
  }

  // ── existsByCode ─────────────────────────────────────────────────────────

  async existsByCode(code: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.PromotionWhereInput = {
      isDeleted: false,
      couponCode: { equals: code, mode: "insensitive" },
    }

    if (excludeId !== undefined) {
      where.id = { not: excludeId }
    }

    const count = await prisma.promotion.count({ where })
    return count > 0
  }
}
