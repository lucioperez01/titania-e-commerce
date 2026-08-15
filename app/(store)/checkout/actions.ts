"use server";

import { prisma } from "@/infrastructure/db/prismaClient";
import { revalidatePath } from "next/cache";
import { PrismaCartRepository } from "@/infrastructure/repositories/PrismaCartRepository";
import { getCart } from "@/domain/cart/use-cases/get-cart";

export interface ConsentResult {
  success: boolean;
  error?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: number;
  error?: string;
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
