export interface OrderConfirmationData {
  orderNumber: number;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentLink: string;
}

export function renderOrderConfirmationEmail(data: OrderConfirmationData): string {
  const { orderNumber, customerName, items, total, paymentLink } = data;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <span style="font-size: 14px; color: #333;">${item.name}</span>
          <span style="font-size: 12px; color: #666; margin-left: 8px;">× ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 14px; color: #333;">
          $${item.price.toLocaleString("es-AR")}
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pedido</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Titania</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Pedido #${orderNumber} — Confirmación</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111; font-size: 20px; font-weight: 600;">¡Hola, ${customerName}!</h2>
              <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.5;">
                Gracias por tu pedido. Recibimos tu orden y está esperando el pago para ser procesada.
              </p>
              <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.5;">
                Para completar tu compra, hacé clic en el botón de abajo y finalizá el pago de forma segura con MercadoPago.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Completar pago
                    </a>
                  </td>
                </tr>
              </table>
              <h3 style="margin: 32px 0 16px 0; color: #111; font-size: 16px; font-weight: 600;">Resumen del pedido</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 16px 0 0 0; font-size: 16px; font-weight: 600; color: #111;">Total</td>
                  <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #a855f7;">
                    $${total.toLocaleString("es-AR")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                Si tenés alguna consulta, respondé este email.
              </p>
              <p style="margin: 8px 0 0 0; color: #999; font-size: 11px;">
                © ${new Date().getFullYear()} Titania. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
