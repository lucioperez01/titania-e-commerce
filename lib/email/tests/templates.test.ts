import { renderOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { renderOrderPaidEmail } from "@/lib/email/templates/order-paid";
import { renderOrderShippedEmail } from "@/lib/email/templates/order-shipped";
import { renderAdminNewSaleEmail } from "@/lib/email/templates/admin-new-sale";

describe("Email Templates", () => {
  describe("renderOrderConfirmationEmail", () => {
    it("renders HTML with order data and payment link", () => {
      const html = renderOrderConfirmationEmail({
        orderNumber: 42,
        customerName: "Juan Pérez",
        items: [
          { name: "Producto A", quantity: 2, price: 1000 },
          { name: "Producto B", quantity: 1, price: 500 },
        ],
        total: 2500,
        paymentLink: "https://mercadopago.com/pay/123",
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Juan Pérez");
      expect(html).toContain("#42");
      expect(html).toContain("Producto A");
      expect(html).toContain("Producto B");
      expect(html).toContain("$2.500");
      expect(html).toContain("https://mercadopago.com/pay/123");
      expect(html).toContain("Completar pago");
    });

    it("includes inline CSS for email compatibility", () => {
      const html = renderOrderConfirmationEmail({
        orderNumber: 1,
        customerName: "Test",
        items: [{ name: "Item", quantity: 1, price: 100 }],
        total: 100,
        paymentLink: "https://example.com",
      });

      expect(html).toContain("style=");
      expect(html).not.toContain("<style>");
    });
  });

  describe("renderOrderPaidEmail", () => {
    it("renders HTML with payment confirmation", () => {
      const html = renderOrderPaidEmail({
        orderNumber: 42,
        customerName: "María García",
        items: [{ name: "Producto", quantity: 1, price: 3000 }],
        total: 3000,
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("María García");
      expect(html).toContain("Pago confirmado");
      expect(html).toContain("#42");
      expect(html).toContain("$3.000");
      expect(html).toContain("preparando tu pedido");
    });
  });

  describe("renderOrderShippedEmail", () => {
    it("renders HTML with tracking number", () => {
      const html = renderOrderShippedEmail({
        orderNumber: 42,
        customerName: "Carlos López",
        trackingNumber: "ABC123456",
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Carlos López");
      expect(html).toContain("#42");
      expect(html).toContain("ABC123456");
      expect(html).toContain("en camino");
    });
  });

  describe("renderAdminNewSaleEmail", () => {
    it("renders HTML with full order details for admin", () => {
      const html = renderAdminNewSaleEmail({
        orderNumber: 42,
        customerName: "Ana Rodríguez",
        customerEmail: "ana@example.com",
        items: [
          { name: "Producto X", quantity: 3, price: 1500 },
        ],
        total: 4500,
        shippingAddress: {
          line1: "Av. Siempre Viva 753",
          city: "CABA",
          province: "Buenos Aires",
          postalCode: "1234",
          country: "AR",
        },
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Nueva venta");
      expect(html).toContain("#42");
      expect(html).toContain("Ana Rodríguez");
      expect(html).toContain("ana@example.com");
      expect(html).toContain("Producto X");
      expect(html).toContain("$4.500");
      expect(html).toContain("Av. Siempre Viva 753");
      expect(html).toContain("CABA");
    });
  });
});
