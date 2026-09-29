import { resend, getFromEmail, getAdminEmail } from "./resend-client";
import { renderOrderConfirmationEmail, OrderConfirmationData } from "./templates/order-confirmation";
import { renderOrderPaidEmail, OrderPaidData } from "./templates/order-paid";
import { renderOrderShippedEmail, OrderShippedData } from "./templates/order-shipped";
import { renderAdminNewSaleEmail, AdminNewSaleData } from "./templates/admin-new-sale";

export type OrderEmailEvent = "order.created" | "order.paid" | "order.shipped";

export interface OrderEmailData {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentLink?: string;
  trackingNumber?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendOrderEmail(event: OrderEmailEvent, data: OrderEmailData): Promise<void> {
  if (!isValidEmail(data.customerEmail)) {
    console.warn(`[sendOrderEmail] Invalid customer email: ${data.customerEmail}. Skipping.`);
    return;
  }

  const fromEmail = getFromEmail();

  try {
    switch (event) {
      case "order.created": {
        if (!data.paymentLink) {
          console.warn("[sendOrderEmail] Missing paymentLink for order.created. Skipping.");
          return;
        }
        const confirmationData: OrderConfirmationData = {
          orderNumber: data.orderNumber,
          customerName: data.customerName,
          items: data.items,
          total: data.total,
          paymentLink: data.paymentLink,
        };
        const html = renderOrderConfirmationEmail(confirmationData);
        await resend.emails.send({
          from: fromEmail,
          to: data.customerEmail,
          subject: `Confirmación de pedido #${data.orderNumber} — Titania`,
          html,
        });
        break;
      }

      case "order.paid": {
        const paidData: OrderPaidData = {
          orderNumber: data.orderNumber,
          customerName: data.customerName,
          items: data.items,
          total: data.total,
        };
        const paidHtml = renderOrderPaidEmail(paidData);
        await resend.emails.send({
          from: fromEmail,
          to: data.customerEmail,
          subject: `¡Pago confirmado! Pedido #${data.orderNumber} — Titania`,
          html: paidHtml,
        });

        const adminEmail = getAdminEmail();
        if (isValidEmail(adminEmail) && data.shippingAddress) {
          const adminData: AdminNewSaleData = {
            orderNumber: data.orderNumber,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            items: data.items,
            total: data.total,
            shippingAddress: data.shippingAddress,
          };
          const adminHtml = renderAdminNewSaleEmail(adminData);
          await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `🎉 Nueva venta — Pedido #${data.orderNumber}`,
            html: adminHtml,
          });
        }
        break;
      }

      case "order.shipped": {
        if (!data.trackingNumber) {
          console.warn("[sendOrderEmail] Missing trackingNumber for order.shipped. Skipping.");
          return;
        }
        const shippedData: OrderShippedData = {
          orderNumber: data.orderNumber,
          customerName: data.customerName,
          trackingNumber: data.trackingNumber,
        };
        const shippedHtml = renderOrderShippedEmail(shippedData);
        await resend.emails.send({
          from: fromEmail,
          to: data.customerEmail,
          subject: `¡Tu pedido #${data.orderNumber} fue enviado! — Titania`,
          html: shippedHtml,
        });
        break;
      }
    }
  } catch (error) {
    console.error(`[sendOrderEmail] Error sending ${event} email for order #${data.orderNumber}:`, error);
  }
}

export function sendOrderEmailAsync(event: OrderEmailEvent, data: OrderEmailData): void {
  sendOrderEmail(event, data).catch((error) => {
    console.error(`[sendOrderEmailAsync] Unhandled error for order #${data.orderNumber}:`, error);
  });
}
