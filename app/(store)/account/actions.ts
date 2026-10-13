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
