export interface AdminNewSaleData {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
}

export function renderAdminNewSaleEmail(data: AdminNewSaleData): string {
  const { orderNumber, customerName, customerEmail, items, total, shippingAddress } = data;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #333;">
          ${item.name} <span style="color: #666;">× ${item.quantity}</span>
        </td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #333;">
          $${(item.price * item.quantity).toLocaleString("es-AR")}
        </td>
      </tr>
    `
    )
    .join("");

  const addressLines = [
    shippingAddress.line1,
    shippingAddress.line2,
    `${shippingAddress.city}, ${shippingAddress.province}`,
    `CP: ${shippingAddress.postalCode}`,
    shippingAddress.country,
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva venta</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🎉 ¡Nueva venta!</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Pedido #${orderNumber}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin: 0 0 24px 0; color: #111; font-size: 18px; font-weight: 600;">Detalles del pedido</h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666; width: 120px;">Cliente</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Email</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333;">${customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666; vertical-align: top;">Dirección</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333;">
                    ${addressLines.map((line) => `<div>${line}</div>`).join("")}
                  </td>
                </tr>
              </table>

              <h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 600;">Productos</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-top: 1px solid #eee;">
                ${itemsHtml}
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; border-top: 2px solid #eee;">
                <tr>
                  <td style="padding: 16px 0 0 0; font-size: 18px; font-weight: 700; color: #111;">Total</td>
                  <td style="padding: 16px 0 0 0; text-align: right; font-size: 22px; font-weight: 700; color: #d97706;">
                    $${total.toLocaleString("es-AR")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                Este es un email automático del sistema de Titania.
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
