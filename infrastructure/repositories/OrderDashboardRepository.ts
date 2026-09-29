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

    const [totalSoldResult, avgTicketResult, orderItems, repeatCustomersResult] =
      await Promise.all([
        prisma.order.aggregate({
          where: { status: { in: paidStatuses }, isDeleted: false },
          _sum: { total: true },
          _count: true,
        }),
        prisma.order.aggregate({
          where: { status: "PAID", isDeleted: false },
          _avg: { total: true },
        }),
        prisma.orderItem.findMany({
          where: {
            order: { status: { in: paidStatuses }, isDeleted: false },
          },
          include: {
            product: { select: { name: true } },
          },
        }),
        prisma.order.groupBy({
          by: ["email"],
          where: { status: { in: paidStatuses }, isDeleted: false },
          _count: { email: true },
        }),
      ]);

    const totalSold = Number(totalSoldResult._sum.total ?? 0);
    const totalOrders = totalSoldResult._count;
    const avgTicket = Number(avgTicketResult._avg.total ?? 0);

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

    return {
      totalSold,
      totalOrders,
      avgTicket,
      bestSellers,
      worstSellers,
      repeatCustomers,
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
