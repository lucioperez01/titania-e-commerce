import { prisma } from "@/infrastructure/db/prismaClient";
import { Prisma, OrderStatus } from "@prisma/client";

export interface OrderFilters {
  status?: OrderStatus;
  email?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface OrderListResult {
  orders: Array<{
    id: number;
    email: string;
    fullName: string;
    total: number;
    status: OrderStatus;
    createdAt: Date;
    itemCount: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardMetrics {
  totalSold: number;
  totalOrders: number;
  avgTicket: number;
  bestSellers: Array<{
    productId: number;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  worstSellers: Array<{
    productId: number;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  repeatCustomers: number;
  todaySales: number;
  totalSoldTrend: number;
  avgTicketTrend: number;
  totalOrdersTrend: number;
  repeatCustomersTrend: number;
  todaySalesTrend: number;
}

/**
 * Calculate percentage change between two values.
 * Returns 0 when both are zero; returns 100 when previous is zero but current > 0.
 */
function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export class OrderDashboardRepository {
  async findOrdersWithFilters(filters: OrderFilters): Promise<OrderListResult> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {
      isDeleted: false,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.email) {
      where.email = { contains: filters.email, mode: "insensitive" };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            select: { quantity: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    const mappedOrders = orders.map((order) => ({
      id: order.id,
      email: order.email,
      fullName: order.fullName,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    return {
      orders: mappedOrders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOrderWithDetails(id: number) {
    return prisma.order.findUnique({
      where: { id, isDeleted: false },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true },
            },
          },
        },
        shippingAddress: true,
        transitions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const paidStatuses: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];

    const now = new Date();

    // Today boundaries
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Current month boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Previous month boundaries
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = currentMonthStart;

    // Last 7 days (for daily average comparison)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalSoldResult,
      avgTicketResult,
      orderItems,
      repeatCustomersResult,
      todaySalesResult,
      currentMonthResult,
      previousMonthResult,
      currentMonthAvgResult,
      previousMonthAvgResult,
      last7DaysResult,
      currentMonthRepeatResult,
      previousMonthRepeatResult,
    ] = await Promise.all([
      // All-time revenue + order count
      prisma.order.aggregate({
        where: { status: { in: paidStatuses }, isDeleted: false },
        _sum: { total: true },
        _count: true,
      }),
      // All-time average ticket
      prisma.order.aggregate({
        where: { status: "PAID", isDeleted: false },
        _avg: { total: true },
      }),
      // Order items for best/worst sellers
      prisma.orderItem.findMany({
        where: {
          order: { status: { in: paidStatuses }, isDeleted: false },
        },
        include: {
          product: { select: { name: true } },
        },
      }),
      // All-time repeat customers
      prisma.order.groupBy({
        by: ["email"],
        where: { status: { in: paidStatuses }, isDeleted: false },
        _count: { email: true },
      }),
      // Today's sales
      prisma.order.aggregate({
        where: { status: "PAID", isDeleted: false, paidAt: { gte: today, lt: tomorrow } },
        _sum: { total: true },
      }),
      // Current month revenue + count
      prisma.order.aggregate({
        where: {
          status: { in: paidStatuses },
          isDeleted: false,
          paidAt: { gte: currentMonthStart, lt: currentMonthEnd },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Previous month revenue + count
      prisma.order.aggregate({
        where: {
          status: { in: paidStatuses },
          isDeleted: false,
          paidAt: { gte: previousMonthStart, lt: previousMonthEnd },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Current month average ticket
      prisma.order.aggregate({
        where: {
          status: "PAID",
          isDeleted: false,
          paidAt: { gte: currentMonthStart, lt: currentMonthEnd },
        },
        _avg: { total: true },
      }),
      // Previous month average ticket
      prisma.order.aggregate({
        where: {
          status: "PAID",
          isDeleted: false,
          paidAt: { gte: previousMonthStart, lt: previousMonthEnd },
        },
        _avg: { total: true },
      }),
      // Last 7 days total (for daily average)
      prisma.order.aggregate({
        where: {
          status: "PAID",
          isDeleted: false,
          paidAt: { gte: sevenDaysAgo },
        },
        _sum: { total: true },
      }),
      // Current month repeat customers
      prisma.order.groupBy({
        by: ["email"],
        where: {
          status: { in: paidStatuses },
          isDeleted: false,
          paidAt: { gte: currentMonthStart, lt: currentMonthEnd },
        },
        _count: { email: true },
      }),
      // Previous month repeat customers
      prisma.order.groupBy({
        by: ["email"],
        where: {
          status: { in: paidStatuses },
          isDeleted: false,
          paidAt: { gte: previousMonthStart, lt: previousMonthEnd },
        },
        _count: { email: true },
      }),
    ]);

    const totalSold = Number(totalSoldResult._sum.total ?? 0);
    const totalOrders = totalSoldResult._count;
    const avgTicket = Number(avgTicketResult._avg.total ?? 0);

    // Best/worst sellers
    const productMap = new Map<
      number,
      { productId: number; productName: string; quantity: number; revenue: number }
    >();

    for (const item of orderItems) {
      const existing = productMap.get(item.productId);
      const itemRevenue = Number(item.price) * item.quantity;

      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += itemRevenue;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          revenue: itemRevenue,
        });
      }
    }

    const products = Array.from(productMap.values());
    products.sort((a, b) => b.quantity - a.quantity);

    const bestSellers = products.slice(0, 5);
    const worstSellers = products.slice(-5).reverse();

    const repeatCustomers = repeatCustomersResult.filter(
      (group) => group._count.email > 1
    ).length;

    const todaySales = Number(todaySalesResult._sum.total ?? 0);

    // Trend calculations
    const currentMonthSold = Number(currentMonthResult._sum.total ?? 0);
    const previousMonthSold = Number(previousMonthResult._sum.total ?? 0);
    const currentMonthOrders = currentMonthResult._count;
    const previousMonthOrders = previousMonthResult._count;
    const currentMonthAvg = Number(currentMonthAvgResult._avg.total ?? 0);
    const previousMonthAvg = Number(previousMonthAvgResult._avg.total ?? 0);
    const last7DaysTotal = Number(last7DaysResult._sum.total ?? 0);
    const dailyAverage = last7DaysTotal / 7;

    const currentMonthRepeat = currentMonthRepeatResult.filter(
      (g) => g._count.email > 1
    ).length;
    const previousMonthRepeat = previousMonthRepeatResult.filter(
      (g) => g._count.email > 1
    ).length;

    return {
      totalSold,
      totalOrders,
      avgTicket,
      bestSellers,
      worstSellers,
      repeatCustomers,
      todaySales,
      totalSoldTrend: calcTrend(currentMonthSold, previousMonthSold),
      avgTicketTrend: calcTrend(currentMonthAvg, previousMonthAvg),
      totalOrdersTrend: calcTrend(currentMonthOrders, previousMonthOrders),
      repeatCustomersTrend: calcTrend(currentMonthRepeat, previousMonthRepeat),
      todaySalesTrend: calcTrend(todaySales, dailyAverage),
    };
  }

  async getRecentOrders(limit: number = 10) {
    return prisma.order.findMany({
      where: { isDeleted: false },
      include: {
        items: {
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
