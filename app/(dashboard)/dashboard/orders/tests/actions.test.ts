const mockRevalidatePath = jest.fn();
const mockTransitionExecute = jest.fn();
const mockOrderFindMany = jest.fn();
const mockOrderCount = jest.fn();
const mockOrderFindUnique = jest.fn();
const mockOrderAggregate = jest.fn();
const mockOrderGroupBy = jest.fn();
const mockOrderItemFindMany = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

jest.mock("@/domain/order/use-cases/transition-order-status", () => ({
  TransitionOrderStatus: jest.fn().mockImplementation(() => ({
    execute: mockTransitionExecute,
  })),
}));

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

import { shipOrderAction, cancelOrderAction } from "@/app/(dashboard)/dashboard/orders/actions";

describe("Order Dashboard Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("shipOrderAction", () => {
    it("transitions order to SHIPPED with tracking number", async () => {
      mockTransitionExecute.mockResolvedValue({
        orderId: 1,
        previousStatus: "PAID",
        newStatus: "SHIPPED",
      });

      const result = await shipOrderAction(1, "ABC123");

      expect(result.success).toBe(true);
      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 1,
        newStatus: "SHIPPED",
        trigger: "admin",
        trackingNumber: "ABC123",
        reason: "Marcado como enviado desde el dashboard",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/orders");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/orders/1");
    });

    it("returns error when tracking number is empty", async () => {
      const result = await shipOrderAction(1, "");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/seguimiento/);
      expect(mockTransitionExecute).not.toHaveBeenCalled();
    });

    it("returns error when tracking number is only whitespace", async () => {
      const result = await shipOrderAction(1, "   ");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/seguimiento/);
    });

    it("returns error when transition fails", async () => {
      mockTransitionExecute.mockRejectedValue(new Error("Invalid transition"));

      const result = await shipOrderAction(1, "ABC123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid transition");
    });
  });

  describe("cancelOrderAction", () => {
    it("transitions order to CANCELLED", async () => {
      mockTransitionExecute.mockResolvedValue({
        orderId: 1,
        previousStatus: "PAID",
        newStatus: "CANCELLED",
      });

      const result = await cancelOrderAction(1);

      expect(result.success).toBe(true);
      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 1,
        newStatus: "CANCELLED",
        trigger: "admin",
        reason: "Cancelado desde el dashboard",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/orders");
    });

    it("returns error when transition fails", async () => {
      mockTransitionExecute.mockRejectedValue(new Error("Invalid transition"));

      const result = await cancelOrderAction(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid transition");
    });
  });
});
