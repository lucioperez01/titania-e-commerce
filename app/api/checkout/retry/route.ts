import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prismaClient";
import { MercadoPagoProvider } from "@/infrastructure/providers/mercado-pago-provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const orderIdNum = parseInt(orderId, 10);
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: "Invalid orderId" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderIdNum },
      include: {
        items: {
          include: {
            product: { include: { images: true, variants: true } },
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "RESERVED") {
      return NextResponse.json(
        { error: "Order is not in RESERVED status" },
        { status: 400 }
      );
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 500 }
      );
    }

    const provider = new MercadoPagoProvider(accessToken);
    const baseUrl = process.env.BASE_URL ?? (
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
    );

    const items = order.items.map((item) => ({
      id: `product-${item.productId}${item.variantId ? `-variant-${item.variantId}` : ""}`,
      title: item.variant
        ? `${item.product.name} (${item.variant.sku})`
        : item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      pictureUrl: item.product.images?.[0]?.url,
    }));

    const preference = await provider.createPreference({
      orderId: order.id,
      email: order.email,
      items,
      notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
      successUrl: `${baseUrl}/order/success?order_id=${order.id}`,
      failureUrl: `${baseUrl}/order/failure?order_id=${order.id}`,
      pendingUrl: `${baseUrl}/order/pending?order_id=${order.id}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { preferenceId: preference.preferenceId },
    });

    const isSandbox = accessToken.startsWith("TEST-");
    const initPoint = isSandbox && preference.sandboxInitPoint
      ? preference.sandboxInitPoint
      : preference.initPoint;

    return NextResponse.json({ init_point: initPoint }, { status: 200 });
  } catch (error) {
    console.error("Retry checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create new checkout session" },
      { status: 500 }
    );
  }
}
