"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/infrastructure/db/prismaClient"

export type OrderSummary = {
  id: number
  orderNumber: string
  status: string
  total: number
  itemCount: number
  city: string
  province: string
  createdAt: string
}

export async function getOrderById(orderId: number) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = Number(session.user.id)

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, isDeleted: false },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              price: true,
              images: {
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
      shippingAddress: true,
      transitions: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!order) return null

  return {
    id: order.id,
    orderNumber: `#${order.id}`,
    status: order.status,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price),
        image: item.product.images[0]?.url || null,
      },
    })),
    shippingAddress: {
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      line1: order.shippingAddress.line1,
      line2: order.shippingAddress.line2,
      city: order.shippingAddress.city,
      province: order.shippingAddress.province,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
    },
    transitions: order.transitions.map((t) => ({
      id: t.id,
      previousStatus: t.previousStatus,
      newStatus: t.newStatus,
      createdAt: t.createdAt.toISOString(),
    })),
  }
}

export async function getUserOrders(): Promise<OrderSummary[]> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = Number(session.user.id)

  const orders = await prisma.order.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      shippingAddress: {
        select: { city: true, province: true },
      },
      items: {
        select: { id: true },
      },
    },
  })

  return orders.map((order) => ({
    id: order.id,
    orderNumber: `#${order.id}`,
    status: order.status,
    total: Number(order.total),
    itemCount: order.items.length,
    city: order.shippingAddress.city,
    province: order.shippingAddress.province,
    createdAt: order.createdAt.toISOString(),
  }))
}
