export interface OrderPaidData {
  orderNumber: number;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export function renderOrderPaidEmail(data: OrderPaidData): string {
  const { orderNumber, customerName, items, total } = data;

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
  <title>Pago confirmado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px auto; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px; color: #ffffff;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">¡Pago confirmado!</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Pedido #${orderNumber}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111; font-size: 20px; font-weight: 600;">¡Hola, ${customerName}!</h2>
              <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.5;">
                Tu pago fue procesado correctamente. Estamos preparando tu pedido para enviarlo lo antes posible.
              </p>
              <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.5;">
                Te enviaremos otro email cuando tu pedido sea despachado con el número de seguimiento.
              </p>
              <h3 style="margin: 32px 0 16px 0; color: #111; font-size: 16px; font-weight: 600;">Resumen del pedido</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 16px 0 0 0; font-size: 16px; font-weight: 600; color: #111;">Total pagado</td>
                  <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #10b981;">
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
