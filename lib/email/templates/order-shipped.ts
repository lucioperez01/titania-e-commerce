export interface OrderShippedData {
  orderNumber: number;
  customerName: string;
  trackingNumber: string;
}

export function renderOrderShippedEmail(data: OrderShippedData): string {
  const { orderNumber, customerName, trackingNumber } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido enviado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px auto; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px; color: #ffffff;">📦</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">¡Tu pedido va en camino!</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Pedido #${orderNumber}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111; font-size: 20px; font-weight: 600;">¡Hola, ${customerName}!</h2>
              <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.5;">
                Tu pedido fue despachado y está en camino. Ya casi lo tenés!
              </p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Número de seguimiento</p>
                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #7c3aed; font-family: monospace; letter-spacing: 1px;">
                  ${trackingNumber}
                </p>
              </div>
              <p style="margin: 24px 0 0 0; color: #555; font-size: 16px; line-height: 1.5;">
                Podés usar este número para hacer seguimiento de tu paquete. Si tenés alguna consulta, no dudes en contactarnos.
              </p>
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
