"use server";

import { prisma } from "@/infrastructure/db/prismaClient";
import { revalidatePath } from "next/cache";
import { PrismaCartRepository } from "@/infrastructure/repositories/PrismaCartRepository";
import { CreateReservedOrder } from "@/domain/order/use-cases/create-reserved-order";
import { redirect } from "next/navigation";
import { sendOrderEmailAsync } from "@/lib/email/send-order-emails";

export interface ConsentResult {
  success: boolean;
  error?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: number;
  error?: string;
}

export interface CheckoutRedirectResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

export interface OrderSummary {
  subtotal: number;
  shippingCost: number;
  total: number;
  itemCount: number;
}

const IDEMPOTENCY_WINDOW_MS = 5000; // 5 seconds

export async function getOrderSummary(): Promise<OrderSummary> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { subtotal: 0, shippingCost: 0, total: 0, itemCount: 0 };
    }

    const userId = Number(session.user.id);
    const cartRepository = new PrismaCartRepository();
    const cart = await cartRepository.findByUserId(userId);

    if (!cart || cart.items.length === 0) {
      return { subtotal: 0, shippingCost: 0, total: 0, itemCount: 0 };
    }

    const productIds = cart.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    let subtotal = 0;
    for (const item of cart.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const price = item.variantId
        ? product.variants.find(v => v.id === item.variantId)?.price ?? product.price
        : product.price;
      subtotal += Number(price) * item.quantity;
    }

    const shippingCost = subtotal >= 50000 ? 0 : 14000;
    const total = subtotal + shippingCost;
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, shippingCost, total, itemCount };
  } catch (error) {
    console.error("getOrderSummary error:", error);
    return { subtotal: 0, shippingCost: 0, total: 0, itemCount: 0 };
  }
}

export async function saveConsent(mailing: boolean): Promise<ConsentResult> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Debe iniciar sesión para guardar preferencias",
      };
    }

    const userId = Number(session.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { mailing },
    });

    revalidatePath("/checkout");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Error al guardar preferencias",
    };
  }
}

export async function createOrderAction(formData: {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressCity: string;
  addressProvince: string;
  addressPostalCode: string;
  addressCountry?: string;
}): Promise<CreateOrderResult> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Debe iniciar sesión para crear un pedido" };
    }

    const userId = Number(session.user.id);
    const cartRepository = new PrismaCartRepository();
    const cart = await cartRepository.findByUserId(userId);

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "El carrito está vacío" };
    }

    const productIds = cart.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    let subtotal = 0;
    for (const item of cart.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) return { success: false, error: `Producto #${item.productId} no encontrado` };

      const price = item.variantId
        ? product.variants.find(v => v.id === item.variantId)?.price ?? product.price
        : product.price;
      subtotal += Number(price) * item.quantity;
    }

    const shippingCost = subtotal >= 50000 ? 0 : 14000;
    const total = subtotal + shippingCost;

    const address = await prisma.address.create({
      data: {
        userId,
        fullName: formData.fullName,
        phone: formData.phone,
        line1: formData.addressLine1,
        city: formData.addressCity,
        province: formData.addressProvince,
        postalCode: formData.addressPostalCode,
        country: formData.addressCountry ?? "AR",
      },
    });

    const order = await prisma.order.create({
      data: {
        userId,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        subtotal,
        total,
        shippingCost,
        shippingAddressId: address.id,
        items: {
          create: await Promise.all(
            cart.items.map(async (item) => {
              const product = products.find(p => p.id === item.productId)!;
              const price = item.variantId
                ? product.variants.find(v => v.id === item.variantId)?.price ?? product.price
                : product.price;
              return {
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price,
              };
            })
          ),
        },
      },
    });

    for (const item of cart.items) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: "CONVERTED" },
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("createOrderAction error:", error);
    return { success: false, error: "Error al crear el pedido" };
  }
}

/**
 * New checkout action: creates a RESERVED order and redirects to MercadoPago.
 * Includes idempotency check to prevent duplicate orders from double-clicks.
 */
export async function checkoutWithMercadoPago(formData: {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressCity: string;
  addressProvince: string;
  addressPostalCode: string;
  addressCountry?: string;
}): Promise<CheckoutRedirectResult> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Debe iniciar sesión para crear un pedido" };
    }

    const userId = Number(session.user.id);
    const cartRepository = new PrismaCartRepository();
    const cart = await cartRepository.findByUserId(userId);

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "El carrito está vacío" };
    }

    // Idempotency check: look for a RESERVED order created within the last 5 seconds
    const recentOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: "RESERVED",
        createdAt: {
          gte: new Date(Date.now() - IDEMPOTENCY_WINDOW_MS),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOrder && recentOrder.preferenceId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? (
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
      );

      return {
        success: true,
        redirectUrl: `${baseUrl}/order/pending?order_id=${recentOrder.id}`,
      };
    }

    // Check feature flag
    if (process.env.PAYMENTS_ENABLED !== "true") {
      return { success: false, error: "Los pagos aún no están disponibles" };
    }

    // Create reserved order + MP preference
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MercadoPago access token not configured");
    }

    const useCase = new CreateReservedOrder(accessToken);
    const result = await useCase.execute({
      userId,
      email: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      addressLine1: formData.addressLine1,
      addressCity: formData.addressCity,
      addressProvince: formData.addressProvince,
      addressPostalCode: formData.addressPostalCode,
      addressCountry: formData.addressCountry,
      cartId: cart.id,
    });

    // Determine if sandbox
    const isSandbox = process.env.MP_ACCESS_TOKEN?.startsWith("TEST-");
    const redirectUrl = isSandbox && result.sandboxInitPoint
      ? result.sandboxInitPoint
      : result.initPoint;

    const orderWithItems = await prisma.order.findUnique({
      where: { id: result.orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });

    if (orderWithItems) {
      sendOrderEmailAsync("order.created", {
        orderNumber: orderWithItems.id,
        customerName: orderWithItems.fullName,
        customerEmail: orderWithItems.email,
        items: orderWithItems.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        total: Number(orderWithItems.total),
        paymentLink: redirectUrl,
      });
    }

    return {
      success: true,
      redirectUrl,
    };
  } catch (error) {
    console.error("checkoutWithMercadoPago error:", error);
    const message = error instanceof Error ? error.message : "Error al procesar el pedido";
    return { success: false, error: message };
  }
}

/**
 * Server action that handles the form submission and redirects to MP.
 * This is called from the checkout form.
 */
export async function checkoutAction(formData: FormData): Promise<void> {
  const result = await checkoutWithMercadoPago({
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    addressLine1: formData.get("addressLine1") as string,
    addressCity: formData.get("addressCity") as string,
    addressProvince: formData.get("addressProvince") as string,
    addressPostalCode: formData.get("addressPostalCode") as string,
    addressCountry: (formData.get("addressCountry") as string) || "AR",
  });

  if (!result.success || !result.redirectUrl) {
    // Redirect to checkout with error
    const errorMsg = encodeURIComponent(result.error ?? "Error desconocido");
    redirect(`/checkout?error=${errorMsg}`);
  }

  // Redirect to MercadoPago checkout
  redirect(result.redirectUrl);
}
