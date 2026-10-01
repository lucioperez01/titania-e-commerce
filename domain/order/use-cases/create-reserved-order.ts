import { prisma } from "@/infrastructure/db/prismaClient";
import { MercadoPagoProvider } from "@/infrastructure/providers/mercado-pago-provider";
import { OrderStatus } from "@/domain/order/entities/OrderStatus";

export interface CartItemInput {
  productId: number;
  variantId: number | null;
  quantity: number;
}

export interface ReservedOrderInput {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressCity: string;
  addressProvince: string;
  addressPostalCode: string;
  addressCountry?: string;
  cartId: number;
}

export interface ReservedOrderResult {
  orderId: number;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
}

export class CreateReservedOrder {
  private provider: MercadoPagoProvider;

  constructor(accessToken: string) {
    this.provider = new MercadoPagoProvider(accessToken);
  }

  async execute(input: ReservedOrderInput): Promise<ReservedOrderResult> {
    // 1. Fetch cart with items
    const cart = await prisma.cart.findUnique({
      where: { id: input.cartId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("El carrito está vacío");
    }

    if (cart.status === "CONVERTED") {
      throw new Error("Este carrito ya fue convertido en un pedido");
    }

    // 2. Fetch products with variants for stock validation and pricing
    const productIds = [...new Set(cart.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true, images: true },
    });

    // 3. Validate stock and compute pricing
    const itemsWithPrice: Array<{
      productId: number;
      variantId: number | null;
      quantity: number;
      price: number;
      title: string;
      pictureUrl?: string;
    }> = [];

    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product) {
        throw new Error(`Producto #${cartItem.productId} no encontrado`);
      }

      const availableStock = cartItem.variantId
        ? product.variants.find((v) => v.id === cartItem.variantId)?.stock ?? 0
        : product.stock;

      const reservedStock = cartItem.variantId
        ? product.variants.find((v) => v.id === cartItem.variantId)?.reservedStock ?? 0
        : product.reservedStock;

      const available = availableStock - reservedStock;

      if (available < cartItem.quantity) {
        const productName = cartItem.variantId
          ? `${product.name} (${product.variants.find((v) => v.id === cartItem.variantId)?.sku ?? cartItem.variantId})`
          : product.name;
        throw new Error(
          `Stock insuficiente para "${productName}". Disponible: ${available}, solicitado: ${cartItem.quantity}`
        );
      }

      const price = cartItem.variantId
        ? product.variants.find((v) => v.id === cartItem.variantId)?.price ?? product.price
        : product.price;

      subtotal += Number(price) * cartItem.quantity;

      itemsWithPrice.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        price: Number(price),
        title: cartItem.variantId
          ? `${product.name} (${product.variants.find((v) => v.id === cartItem.variantId)?.sku ?? cartItem.variantId})`
          : product.name,
        pictureUrl: product.images?.[0]?.url,
      });
    }

    const shippingCost = subtotal >= 50000 ? 0 : 14000;
    const total = subtotal + shippingCost;

    // 4. Create order + address + order items + stock reservation in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create address
      const address = await tx.address.create({
        data: {
          userId: input.userId,
          fullName: input.fullName,
          phone: input.phone,
          line1: input.addressLine1,
          city: input.addressCity,
          province: input.addressProvince,
          postalCode: input.addressPostalCode,
          country: input.addressCountry ?? "AR",
        },
      });

      // Create order
      const order = await tx.order.create({
        data: {
          userId: input.userId,
          email: input.email,
          fullName: input.fullName,
          phone: input.phone,
          subtotal,
          total,
          shippingCost,
          shippingAddressId: address.id,
          status: OrderStatus[OrderStatus.RESERVED] as "RESERVED",
          paymentProvider: "MERCADOPAGO",
          items: {
            create: itemsWithPrice.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // Increment reservedStock atomically
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reservedStock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { increment: item.quantity } },
          });
        }
      }

      // Mark cart as converted
      await tx.cart.update({
        where: { id: input.cartId },
        data: { status: "CONVERTED" },
      });

      return order;
    });

    // 5. Create MP Preference (outside transaction — this is external API call)
    const baseUrl = process.env.BASE_URL ?? (
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
    );

    try {
      // Build items list for MP preference
      const mpItems = itemsWithPrice.map((item) => ({
        id: `product-${item.productId}${item.variantId ? `-variant-${item.variantId}` : ""}`,
        title: item.title,
        quantity: item.quantity,
        unitPrice: item.price,
        pictureUrl: item.pictureUrl,
      }));

      // Add shipping as an item if cost > 0
      if (shippingCost > 0) {
        mpItems.push({
          id: "shipping",
          title: "Envío",
          quantity: 1,
          unitPrice: shippingCost,
          pictureUrl: undefined,
        });
      }

      const preference = await this.provider.createPreference({
        orderId: result.id,
        email: input.email,
        items: mpItems,
        notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
        successUrl: `${baseUrl}/order/success?order_id=${result.id}`,
        failureUrl: `${baseUrl}/order/failure?order_id=${result.id}`,
        pendingUrl: `${baseUrl}/order/pending?order_id=${result.id}`,
      });

      // Store preferenceId on order
      await prisma.order.update({
        where: { id: result.id },
        data: { preferenceId: preference.preferenceId },
      });

      return {
        orderId: result.id,
        preferenceId: preference.preferenceId,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
      };
    } catch (error) {
      // Rollback: if MP preference creation fails, we need to revert the order
      // In production, this could be handled by a cleanup cron job
      console.error("Failed to create MP preference, order created but no preference:", error);
      throw new Error(
        "No se pudo conectar con MercadoPago. El pedido fue creado pero el pago no puede procesarse. Intente nuevamente."
      );
    }
  }
}
