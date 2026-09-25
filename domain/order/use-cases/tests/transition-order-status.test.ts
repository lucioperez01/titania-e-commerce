const mockTransaction = jest.fn();
const mockOrderUpdate = jest.fn();
const mockProductUpdate = jest.fn();
const mockProductVariantUpdate = jest.fn();
const mockTransitionCreate = jest.fn();
const mockTxQueryRaw = jest.fn();
const mockTxOrderFindUnique = jest.fn();

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: {
    $transaction: mockTransaction,
    order: {
      findUnique: jest.fn(),
      update: mockOrderUpdate,
    },
    product: {
      update: mockProductUpdate,
    },
    productVariant: {
      update: mockProductVariantUpdate,
    },
    orderStatusTransition: {
      create: mockTransitionCreate,
    },
  },
}));

import { TransitionOrderStatus } from "../transition-order-status";

const mockOrder = {
  id: 1,
  status: "RESERVED",
  items: [
    { id: 10, productId: 100, variantId: null, quantity: 2 },
    { id: 11, productId: 101, variantId: 20, quantity: 1 },
  ],
};

function buildTxMock(overrides: Record<string, unknown> = {}) {
  return jest.fn().mockImplementation(async (fn) => fn({
    $queryRaw: mockTxQueryRaw,
    order: {
      findUnique: mockTxOrderFindUnique,
      update: mockOrderUpdate,
    },
    product: { update: mockProductUpdate },
    productVariant: { update: mockProductVariantUpdate },
    orderStatusTransition: { create: mockTransitionCreate },
    ...overrides,
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TransitionOrderStatus", () => {
  describe("validation", () => {
    it("should throw if order not found", async () => {
      mockTxQueryRaw.mockResolvedValue([]);
      mockTransaction.mockImplementation(buildTxMock());

      const useCase = new TransitionOrderStatus();
      await expect(useCase.execute({
        orderId: 999,
        newStatus: "PAID",
        trigger: "webhook",
      })).rejects.toThrow("Order #999 not found");
    });

    it("should throw on invalid transition: RESERVED → SHIPPED", async () => {
      mockTxQueryRaw.mockResolvedValue([{ id: 1, status: "RESERVED" }]);
      mockTransaction.mockImplementation(buildTxMock());

      const useCase = new TransitionOrderStatus();
      await expect(useCase.execute({
        orderId: 1,
        newStatus: "SHIPPED",
        trigger: "admin",
      })).rejects.toThrow("Invalid transition: RESERVED → SHIPPED");
    });

    it("should throw on invalid transition: PAID → RESERVED", async () => {
      mockTxQueryRaw.mockResolvedValue([{ id: 1, status: "PAID" }]);
      mockTransaction.mockImplementation(buildTxMock());

      const useCase = new TransitionOrderStatus();
      await expect(useCase.execute({
        orderId: 1,
        newStatus: "RESERVED",
        trigger: "admin",
      })).rejects.toThrow("Invalid transition: PAID → RESERVED");
    });

    it("should throw on invalid transition from terminal state: CANCELLED → PAID", async () => {
      mockTxQueryRaw.mockResolvedValue([{ id: 1, status: "CANCELLED" }]);
      mockTransaction.mockImplementation(buildTxMock());

      const useCase = new TransitionOrderStatus();
      await expect(useCase.execute({
        orderId: 1,
        newStatus: "PAID",
        trigger: "admin",
      })).rejects.toThrow("Invalid transition: CANCELLED → PAID");
    });
  });

  describe("valid transitions", () => {
    beforeEach(() => {
      mockTxQueryRaw.mockResolvedValue([{ id: 1, status: "RESERVED" }]);
      mockTxOrderFindUnique.mockResolvedValue(mockOrder);
      mockOrderUpdate.mockResolvedValue({});
      mockProductUpdate.mockResolvedValue({});
      mockProductVariantUpdate.mockResolvedValue({});
      mockTransitionCreate.mockResolvedValue({});
    });

    describe("RESERVED → PAID", () => {
      it("should commit stock (decrement both stock and reservedStock)", async () => {
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        const result = await useCase.execute({
          orderId: 1,
          newStatus: "PAID",
          trigger: "webhook",
          paymentId: "pay-123",
        });

        expect(result.newStatus).toBe("PAID");
        expect(result.previousStatus).toBe("RESERVED");

        expect(mockProductUpdate).toHaveBeenCalledWith({
          where: { id: 100 },
          data: {
            stock: { decrement: 2 },
            reservedStock: { decrement: 2 },
          },
        });

        expect(mockProductVariantUpdate).toHaveBeenCalledWith({
          where: { id: 20 },
          data: {
            stock: { decrement: 1 },
            reservedStock: { decrement: 1 },
          },
        });

        expect(mockOrderUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              paidAt: expect.any(Date),
            }),
          })
        );
      });

      it("should log transition with source webhook", async () => {
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        await useCase.execute({
          orderId: 1,
          newStatus: "PAID",
          trigger: "webhook",
          paymentId: "pay-123",
          reason: "MercadoPago payment.updated — status: approved",
        });

        expect(mockTransitionCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            orderId: 1,
            previousStatus: "RESERVED",
            newStatus: "PAID",
            trigger: "webhook",
            reason: "MercadoPago payment.updated — status: approved",
          }),
        });
      });
    });

    describe("RESERVED → CANCELLED", () => {
      it("should release stock (decrement reservedStock only)", async () => {
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        const result = await useCase.execute({
          orderId: 1,
          newStatus: "CANCELLED",
          trigger: "webhook",
        });

        expect(result.newStatus).toBe("CANCELLED");

        expect(mockProductUpdate).toHaveBeenCalledWith({
          where: { id: 100 },
          data: { reservedStock: { decrement: 2 } },
        });

        expect(mockProductVariantUpdate).toHaveBeenCalledWith({
          where: { id: 20 },
          data: { reservedStock: { decrement: 1 } },
        });

        expect(mockOrderUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.not.objectContaining({
              paidAt: expect.anything(),
            }),
          })
        );
      });

      it("should work with admin trigger", async () => {
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        await useCase.execute({
          orderId: 1,
          newStatus: "CANCELLED",
          trigger: "admin",
          reason: "Customer requested cancellation",
        });

        expect(mockTransitionCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              trigger: "admin",
            }),
          })
        );
      });
    });

    describe("RESERVED → EXPIRED", () => {
      it("should release stock (decrement reservedStock only)", async () => {
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        await useCase.execute({
          orderId: 1,
          newStatus: "EXPIRED",
          trigger: "cron",
        });

        expect(mockProductUpdate).toHaveBeenCalledWith({
          where: { id: 100 },
          data: { reservedStock: { decrement: 2 } },
        });

        expect(mockTransitionCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              trigger: "cron",
              newStatus: "EXPIRED",
            }),
          })
        );
      });
    });

    describe("PAID → SHIPPED", () => {
      it("should add tracking number", async () => {
        mockTxQueryRaw.mockResolvedValue([{ id: 1, status: "PAID" }]);
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        await useCase.execute({
          orderId: 1,
          newStatus: "SHIPPED",
          trigger: "admin",
          trackingNumber: "TRACK-123",
        });

        expect(mockOrderUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              shippingId: "TRACK-123",
            }),
          })
        );
      });

      it("should not modify stock", async () => {
        mockTxQueryRaw.mockResolvedValue([{ id: 1, status: "PAID" }]);
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        await useCase.execute({
          orderId: 1,
          newStatus: "SHIPPED",
          trigger: "admin",
        });

        expect(mockProductUpdate).not.toHaveBeenCalled();
        expect(mockProductVariantUpdate).not.toHaveBeenCalled();
      });
    });

    describe("PAID → CANCELLED", () => {
      it("should refund stock (increment stock back)", async () => {
        mockTxQueryRaw.mockResolvedValue([{ id: 1, status: "PAID" }]);
        mockTransaction.mockImplementation(buildTxMock());

        const useCase = new TransitionOrderStatus();
        await useCase.execute({
          orderId: 1,
          newStatus: "CANCELLED",
          trigger: "admin",
        });

        expect(mockProductUpdate).toHaveBeenCalledWith({
          where: { id: 100 },
          data: { stock: { increment: 2 } },
        });

        expect(mockProductVariantUpdate).toHaveBeenCalledWith({
          where: { id: 20 },
          data: { stock: { increment: 1 } },
        });
      });
    });
  });
});
