import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserOrders } from "../actions"
import { OrderCard } from "@/components/account/order-card"
import { EmptyOrders } from "@/components/account/empty-orders"
import { Package } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mis Pedidos",
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const orders = await getUserOrders()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
          <Package className="w-5 h-5 text-purple-300" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-primary text-white font-semibold tracking-tight">
            Mis Pedidos
          </h1>
          <p className="text-sm text-white/40 font-secondary mt-0.5">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </p>
        </div>
      </div>

      {/* Content */}
      {orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
