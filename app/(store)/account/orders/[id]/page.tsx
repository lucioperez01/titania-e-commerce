import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getOrderById } from "../../actions"
import { OrderDetail } from "@/components/account/order-detail"
import type { Metadata } from "next"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Detalle del Pedido",
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const orderId = parseInt(id, 10)
  if (isNaN(orderId)) {
    notFound()
  }

  const order = await getOrderById(orderId)
  if (!order) {
    notFound()
  }

  return <OrderDetail order={order} />
}
