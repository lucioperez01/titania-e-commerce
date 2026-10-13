const mockFindFirst = jest.fn();
const mockLogCreate = jest.fn();
const mockLogUpdate = jest.fn();
const mockOrderFindUnique = jest.fn();
const mockValidate = jest.fn();
const mockPaymentGet = jest.fn();
const MockPayment = jest.fn();

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: {
    webhookLog: {
      findFirst: mockFindFirst,
      create: mockLogCreate,
      update: mockLogUpdate,
    },
    order: {
      findUnique: mockOrderFindUnique,
    },
  },
}));

jest.mock("@/infrastructure/providers/webhook-signature-validator", () => ({
  WebhookSignatureValidatorWrapper: {
    validate: mockValidate,
  },
}));

const mockTransitionExecute = jest.fn();
jest.mock("@/domain/order/use-cases/transition-order-status", () => {
  return {
    get TransitionOrderStatus() {
      return jest.fn().mockImplementation(() => ({
        execute: mockTransitionExecute,
      }));
    },
  };
});

jest.mock("mercadopago", () => ({
  __esModule: true,
  default: jest.fn(),
  Payment: MockPayment,
}));

const mockSendOrderEmailAsync = jest.fn();
jest.mock("@/lib/email/send-order-emails", () => ({
  sendOrderEmailAsync: mockSendOrderEmailAsync,
}));

import { POST } from "../route";

const validWebhookBody = {
  id: "evt-123",
  action: "payment.updated",
  data: {
    id: 98765,
  },
};

const mockPaymentResponse = {
  id: 98765,
  status: "approved",
  external_reference: "42",
  transaction_amount: 1500,
};

const createValidRequest = () => {
  const headers = new Headers();
  headers.set("x-signature", "valid-signature-here");
  headers.set("x-request-id", "req-abc123");
  return new Request("http://localhost/api/webhooks/mercadopago", {
    method: "POST",
    headers,
    body: JSON.stringify(validWebhookBody),
  });
};

const createRequestWithHeaders = (body: Record<string, unknown>, headerValues: Record<string, string> = {}) => {
  const headers = new Headers();
  if (headerValues["x-signature"]) headers.set("x-signature", headerValues["x-signature"]);
  if (headerValues["x-request-id"]) headers.set("x-request-id", headerValues["x-request-id"]);
  return new Request("http://localhost/api/webhooks/mercadopago", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

beforeEach(() => {
  jest.resetAllMocks();
  process.env.MP_WEBHOOK_SECRET = "test-webhook-secret";
  process.env.MP_ACCESS_TOKEN = "test-access-token";
  MockPayment.mockImplementation(() => ({
    get: mockPaymentGet,
  }));
});

describe("Webhook Handler POST", () => {
  describe("signature validation", () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should return 401 if signature validation fails", async () => {
      mockValidate.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Invalid signature");
    });

    it("should call validator with correct parameters", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue(null);

      await POST(createValidRequest());

      expect(mockValidate).toHaveBeenCalledWith({
        xSignature: "valid-signature-here",
        xRequestId: "req-abc123",
        dataId: "98765",
        secret: "test-webhook-secret",
      });
    });
  });

  describe("deduplication", () => {
    it("should return 200 immediately if event was already processed", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue({ id: 1, processed: true });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.deduplicated).toBe(true);

      expect(mockLogCreate).not.toHaveBeenCalled();
      expect(mockPaymentGet).not.toHaveBeenCalled();
    });

    it("should create a new log entry for new events", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue(null);

      await POST(createValidRequest());

      expect(mockLogCreate).toHaveBeenCalledWith({
        data: {
          provider: "MERCADOPAGO",
          event: "evt-123",
          payload: validWebhookBody,
          processed: false,
        },
      });
    });
  });

  describe("event processing", () => {
    beforeEach(() => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockLogUpdate.mockResolvedValue({});
    });

    it("should fetch payment from MP API and process approved status", async () => {
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      const response = await POST(createValidRequest());

      expect(response.status).toBe(200);
      expect(mockPaymentGet).toHaveBeenCalledWith({ id: "98765" });
      expect(mockOrderFindUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        include: { items: true },
      });
      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 42,
        newStatus: "PAID",
        trigger: "webhook",
        paymentId: "98765",
        reason: "MercadoPago payment.updated — status: approved",
      });
    });

    it("should process rejected status → CANCELLED", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "rejected",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      await POST(createValidRequest());

      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 42,
        newStatus: "CANCELLED",
        trigger: "webhook",
        paymentId: "98765",
        reason: "MercadoPago payment.updated — status: rejected",
      });
    });

    it("should not transition for pending status (no-op)", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "pending",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(200);
      expect(mockTransitionExecute).not.toHaveBeenCalled();
    });

    it("should return 500 if order not found", async () => {
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue(null);

      const response = await POST(createValidRequest());

      expect(response.status).toBe(500);

      expect(mockLogUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { processed: false },
        })
      );
    });

    it("should return 500 if external_reference is missing from MP payment", async () => {
      mockPaymentGet.mockResolvedValue({
        id: 98765,
        status: "approved",
      });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(500);
    });

    it("should mark log as processed on success", async () => {
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      await POST(createValidRequest());

      expect(mockLogUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { processed: true },
      });
    });

    it("should handle payment.created action", async () => {
      const createdBody = {
        id: "evt-124",
        action: "payment.created",
        data: { id: 98765 },
      };

      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      const response = await POST(createRequestWithHeaders(createdBody, {
        "x-signature": "valid-signature-here",
        "x-request-id": "req-abc123",
      }));

      expect(response.status).toBe(200);
    });

    it("should send email when payment is approved", async () => {
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      // First call: find order for processing
      // Second call: find order with address for email
      mockOrderFindUnique
        .mockResolvedValueOnce({
          id: 42,
          status: "RESERVED",
          items: [],
        })
        .mockResolvedValueOnce({
          id: 42,
          status: "PAID",
          email: "customer@example.com",
          fullName: "John Doe",
          total: 1500,
          items: [
            {
              product: { name: "Test Product" },
              quantity: 2,
              price: 750,
            },
          ],
          shippingAddress: {
            line1: "Calle Falsa 123",
            line2: null,
            city: "Buenos Aires",
            province: "CABA",
            postalCode: "1234",
            country: "AR",
          },
        });
      mockTransitionExecute.mockResolvedValue({});

      await POST(createValidRequest());

      expect(mockSendOrderEmailAsync).toHaveBeenCalledWith(
        "order.paid",
        expect.objectContaining({
          orderNumber: 42,
          customerEmail: "customer@example.com",
          customerName: "John Doe",
          total: 1500,
        })
      );
    });
  });

  describe("error handling", () => {
    it("should return 400 if event ID is missing", async () => {
      mockValidate.mockReturnValue(undefined);

      const noIdBody = {
        action: "payment.updated",
        data: { id: 98765 },
      };

      const response = await POST(createRequestWithHeaders(noIdBody, {
        "x-signature": "valid-signature-here",
        "x-request-id": "req-abc123",
      }));

      expect(response.status).toBe(400);
    });

    it("should return 500 on internal errors", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockRejectedValue(new Error("DB connection error"));

      const response = await POST(createValidRequest());

      expect(response.status).toBe(500);
    });

    it("should return 500 if MP_ACCESS_TOKEN is not configured", async () => {
      delete process.env.MP_ACCESS_TOKEN;
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Processing failed");
    });

    it("should return 500 if external_reference is not a number", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockPaymentGet.mockResolvedValue({
        id: 98765,
        status: "approved",
        external_reference: "invalid-not-a-number",
      });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(500);
    });
  });

  describe("legacy webhook format (query params)", () => {
    it("should handle legacy format with topic=payment&id=123", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      const request = new Request(
        "http://localhost/api/webhooks/mercadopago?topic=payment&id=98765",
        {
          method: "POST",
          headers: {
            "x-signature": "valid-signature-here",
            "x-request-id": "req-abc123",
          },
          body: JSON.stringify({ data: { id: 98765 } }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPaymentGet).toHaveBeenCalledWith({ id: "98765" });
    });

    it("should handle legacy format with data.id in query params", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      const request = new Request(
        "http://localhost/api/webhooks/mercadopago?topic=payment&data.id=98765",
        {
          method: "POST",
          headers: {
            "x-signature": "valid-signature-here",
            "x-request-id": "req-abc123",
          },
          body: JSON.stringify({ data: { id: 98765 } }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("idempotency", () => {
    it("should not transition if order is already in target status", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "PAID", // Already PAID
        items: [],
      });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(200);
      expect(mockTransitionExecute).not.toHaveBeenCalled();
    });
  });

  describe("additional payment status mappings", () => {
    beforeEach(() => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockLogUpdate.mockResolvedValue({});
    });

    it("should transition authorized → PAID", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "authorized",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      await POST(createValidRequest());

      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 42,
        newStatus: "PAID",
        trigger: "webhook",
        paymentId: "98765",
        reason: "MercadoPago payment.updated — status: authorized",
      });
    });

    it("should transition cancelled → CANCELLED", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "cancelled",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      await POST(createValidRequest());

      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 42,
        newStatus: "CANCELLED",
        trigger: "webhook",
        paymentId: "98765",
        reason: "MercadoPago payment.updated — status: cancelled",
      });
    });

    it("should transition refunded → REFUNDED", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "refunded",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "PAID",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      await POST(createValidRequest());

      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 42,
        newStatus: "REFUNDED",
        trigger: "webhook",
        paymentId: "98765",
        reason: "MercadoPago payment.updated — status: refunded",
      });
    });

    it("should transition charged_back → REFUNDED", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "charged_back",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "PAID",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      await POST(createValidRequest());

      expect(mockTransitionExecute).toHaveBeenCalledWith({
        orderId: 42,
        newStatus: "REFUNDED",
        trigger: "webhook",
        paymentId: "98765",
        reason: "MercadoPago payment.updated — status: charged_back",
      });
    });

    it("should not transition for in_process status", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "in_process",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(200);
      expect(mockTransitionExecute).not.toHaveBeenCalled();
    });

    it("should not transition for in_mediation status", async () => {
      mockPaymentGet.mockResolvedValue({
        ...mockPaymentResponse,
        status: "in_mediation",
      });
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });

      const response = await POST(createValidRequest());

      expect(response.status).toBe(200);
      expect(mockTransitionExecute).not.toHaveBeenCalled();
    });
  });

  describe("merchant_order events", () => {
    it("should skip merchant_order events without error", async () => {
      mockValidate.mockReturnValue(undefined);
      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockLogUpdate.mockResolvedValue({});

      const merchantOrderBody = {
        id: "evt-125",
        action: "merchant_order",
        data: { id: 98765 },
      };

      const response = await POST(createRequestWithHeaders(merchantOrderBody, {
        "x-signature": "valid-signature-here",
        "x-request-id": "req-abc123",
      }));

      expect(response.status).toBe(200);
      expect(mockPaymentGet).not.toHaveBeenCalled();
      expect(mockTransitionExecute).not.toHaveBeenCalled();
    });
  });

  describe("development mode", () => {
    it("should skip signature validation in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      delete process.env.MP_WEBHOOK_SECRET;

      mockFindFirst.mockResolvedValue(null);
      mockLogCreate.mockResolvedValue({ id: 1 });
      mockPaymentGet.mockResolvedValue(mockPaymentResponse);
      mockOrderFindUnique.mockResolvedValue({
        id: 42,
        status: "RESERVED",
        items: [],
      });
      mockTransitionExecute.mockResolvedValue({});

      const request = new Request("http://localhost/api/webhooks/mercadopago", {
        method: "POST",
        headers: {
          "x-signature": "any-signature",
          "x-request-id": "req-abc123",
        },
        body: JSON.stringify(validWebhookBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockValidate).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
