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
  });
});
