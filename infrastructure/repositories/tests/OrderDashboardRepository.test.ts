const mockOrderFindMany = jest.fn();
const mockOrderCount = jest.fn();
const mockOrderFindUnique = jest.fn();
const mockOrderAggregate = jest.fn();
const mockOrderGroupBy = jest.fn();
const mockOrderItemFindMany = jest.fn();

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: {
    order: {
      findMany: mockOrderFindMany,
      count: mockOrderCount,
      findUnique: mockOrderFindUnique,
      aggregate: mockOrderAggregate,
      groupBy: mockOrderGroupBy,
    },
    orderItem: {
      findMany: mockOrderItemFindMany,
    },
  },
}));

import { OrderDashboardRepository } from "@/infrastructure/repositories/OrderDashboardRepository";

describe("OrderDashboardRepository", () => {
  let repository: OrderDashboardRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new OrderDashboardRepository();
  });

  describe("findOrdersWithFilters", () => {
    it("returns paginated orders with default pagination", async () => {
      const mockOrders = [
        {
          id: 1,
          email: "test@example.com",
          fullName: "Test User",
          total: 100,
          status: "PAID",
          createdAt: new Date(),
          items: [{ quantity: 2 }],
        },
      ];

      mockOrderFindMany.mockResolvedValue(mockOrders);
      mockOrderCount.mockResolvedValue(1);

      const result = await repository.findOrdersWithFilters({});

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].itemCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it("filters by status", async () => {
      mockOrderFindMany.mockResolvedValue([]);
      mockOrderCount.mockResolvedValue(0);

      await repository.findOrdersWithFilters({ status: "PAID" });

      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PAID",
          }),
        })
      );
    });

    it("filters by email with case-insensitive search", async () => {
      mockOrderFindMany.mockResolvedValue([]);
      mockOrderCount.mockResolvedValue(0);

      await repository.findOrdersWithFilters({ email: "test@example.com" });

      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: { contains: "test@example.com", mode: "insensitive" },
          }),
        })
      );
    });

    it("filters by date range", async () => {
      mockOrderFindMany.mockResolvedValue([]);
      mockOrderCount.mockResolvedValue(0);

      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-12-31");

      await repository.findOrdersWithFilters({ dateFrom, dateTo });

      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: dateFrom, lte: dateTo },
          }),
        })
      );
    });

    it("handles pagination correctly", async () => {
      mockOrderFindMany.mockResolvedValue([]);
      mockOrderCount.mockResolvedValue(50);

      const result = await repository.findOrdersWithFilters({ page: 2, pageSize: 10 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe("findOrderWithDetails", () => {
    it("returns order with items, address, and transitions", async () => {
      const mockOrder = {
        id: 1,
        email: "test@example.com",
        items: [{ id: 1, productId: 1, quantity: 2, product: { name: "Product 1" } }],
        shippingAddress: { line1: "Street 123" },
        transitions: [{ previousStatus: "PENDING", newStatus: "PAID" }],
      };

      mockOrderFindUnique.mockResolvedValue(mockOrder);

      const result = await repository.findOrderWithDetails(1);

      expect(result).toEqual(mockOrder);
      expect(mockOrderFindUnique).toHaveBeenCalledWith({
        where: { id: 1, isDeleted: false },
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
    });
  });

  describe("getDashboardMetrics", () => {
    it("calculates total sold and order count", async () => {
      mockOrderAggregate
        .mockResolvedValueOnce({ _sum: { total: 1000 }, _count: 5 })
        .mockResolvedValueOnce({ _avg: { total: 200 } });

      mockOrderItemFindMany.mockResolvedValue([
        { productId: 1, quantity: 3, price: 100, product: { name: "Product A" } },
        { productId: 2, quantity: 2, price: 200, product: { name: "Product B" } },
      ]);

      mockOrderGroupBy.mockResolvedValue([
        { email: "user1@example.com", _count: { email: 1 } },
        { email: "user2@example.com", _count: { email: 2 } },
      ]);

      const metrics = await repository.getDashboardMetrics();

      expect(metrics.totalSold).toBe(1000);
      expect(metrics.totalOrders).toBe(5);
      expect(metrics.avgTicket).toBe(200);
      expect(metrics.bestSellers).toHaveLength(2);
      expect(metrics.repeatCustomers).toBe(1);
    });

    it("returns best and worst sellers correctly", async () => {
      mockOrderAggregate
        .mockResolvedValueOnce({ _sum: { total: 500 }, _count: 3 })
        .mockResolvedValueOnce({ _avg: { total: 166.67 } });

      mockOrderItemFindMany.mockResolvedValue([
        { productId: 1, quantity: 10, price: 50, product: { name: "Best Product" } },
        { productId: 2, quantity: 5, price: 50, product: { name: "Medium Product" } },
        { productId: 3, quantity: 1, price: 50, product: { name: "Worst Product" } },
      ]);

      mockOrderGroupBy.mockResolvedValue([]);

      const metrics = await repository.getDashboardMetrics();

      expect(metrics.bestSellers[0].productName).toBe("Best Product");
      expect(metrics.bestSellers[0].quantity).toBe(10);
      expect(metrics.worstSellers[0].productName).toBe("Worst Product");
      expect(metrics.worstSellers[0].quantity).toBe(1);
    });
  });

  describe("getRecentOrders", () => {
    it("returns recent orders with limit", async () => {
      const mockOrders = [
        { id: 1, email: "test@example.com", items: [{ quantity: 1 }] },
      ];

      mockOrderFindMany.mockResolvedValue(mockOrders);

      const result = await repository.getRecentOrders(5);

      expect(result).toEqual(mockOrders);
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });
});
