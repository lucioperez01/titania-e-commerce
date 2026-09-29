const mockResendSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}));

import { sendOrderEmail, sendOrderEmailAsync } from "@/lib/email/send-order-emails";

describe("sendOrderEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResendSend.mockResolvedValue({ id: "email-id" });
    process.env.RESEND_API_KEY = "test-key";
    process.env.ADMIN_EMAIL = "admin@test.com";
  });

  describe("order.created", () => {
    it("sends confirmation email with payment link", async () => {
      await sendOrderEmail("order.created", {
        orderNumber: 1,
        customerName: "Test User",
        customerEmail: "test@example.com",
        items: [{ name: "Product", quantity: 1, price: 100 }],
        total: 100,
        paymentLink: "https://mercadopago.com/pay/123",
      });

      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: expect.stringContaining("Confirmación"),
          html: expect.stringContaining("Completar pago"),
        })
      );
    });

    it("skips when paymentLink is missing", async () => {
      await sendOrderEmail("order.created", {
        orderNumber: 1,
        customerName: "Test",
        customerEmail: "test@example.com",
        items: [],
        total: 0,
      });

      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe("order.paid", () => {
    it("sends paid email to customer and admin notification", async () => {
      await sendOrderEmail("order.paid", {
        orderNumber: 2,
        customerName: "Customer",
        customerEmail: "customer@example.com",
        items: [{ name: "Item", quantity: 1, price: 500 }],
        total: 500,
        shippingAddress: {
          line1: "Street 123",
          city: "CABA",
          province: "BA",
          postalCode: "1000",
          country: "AR",
        },
      });

      expect(mockResendSend).toHaveBeenCalledTimes(2);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "customer@example.com",
          subject: expect.stringContaining("Pago confirmado"),
        })
      );
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@test.com",
          subject: expect.stringContaining("Nueva venta"),
        })
      );
    });
  });

  describe("order.shipped", () => {
    it("sends shipped email with tracking number", async () => {
      await sendOrderEmail("order.shipped", {
        orderNumber: 3,
        customerName: "Customer",
        customerEmail: "customer@example.com",
        items: [],
        total: 0,
        trackingNumber: "TRACK123",
      });

      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "customer@example.com",
          subject: expect.stringContaining("enviado"),
          html: expect.stringContaining("TRACK123"),
        })
      );
    });

    it("skips when trackingNumber is missing", async () => {
      await sendOrderEmail("order.shipped", {
        orderNumber: 3,
        customerName: "Customer",
        customerEmail: "customer@example.com",
        items: [],
        total: 0,
      });

      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe("invalid email", () => {
    it("skips sending when customer email is invalid", async () => {
      await sendOrderEmail("order.created", {
        orderNumber: 1,
        customerName: "Test",
        customerEmail: "not-an-email",
        items: [],
        total: 0,
        paymentLink: "https://example.com",
      });

      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("logs error but does not throw when Resend API fails", async () => {
      mockResendSend.mockRejectedValueOnce(new Error("API error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        sendOrderEmail("order.created", {
          orderNumber: 1,
          customerName: "Test",
          customerEmail: "test@example.com",
          items: [],
          total: 0,
          paymentLink: "https://example.com",
        })
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("sendOrderEmailAsync", () => {
    it("fires and forgets without blocking", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      sendOrderEmailAsync("order.created", {
        orderNumber: 1,
        customerName: "Test",
        customerEmail: "test@example.com",
        items: [],
        total: 0,
        paymentLink: "https://example.com",
      });

      consoleSpy.mockRestore();
    });
  });
});
