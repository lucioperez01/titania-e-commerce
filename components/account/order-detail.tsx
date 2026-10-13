import { OrderStatusTimeline } from "./order-status-timeline"
import { OrderItemsList } from "./order-items-list"
import { OrderSummaryCard } from "./order-summary-card"
import { ShippingAddressCard } from "./shipping-address-card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface OrderData {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  total: number
  shippingCost: number
  createdAt: string
  items: Array<{
    id: number
    quantity: number
    price: number
    product: {
      name: string
      slug: string
      price: number
      image: string | null
    }
  }>
  shippingAddress: {
    fullName: string
    phone: string
    line1: string
    line2?: string | null
    city: string
    province: string
    postalCode: string
    country: string
  }
  transitions: Array<{
    id: number
    previousStatus: string
    newStatus: string
    createdAt: string
  }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20" },
  RESERVED: { label: "Reservado", color: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  PAID: { label: "Pagado", color: "text-blue-300 bg-blue-500/10 border-blue-500/20" },
  SHIPPED: { label: "Enviado", color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20" },
  DELIVERED: { label: "Entregado", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  CANCELLED: { label: "Cancelado", color: "text-red-300 bg-red-500/10 border-red-500/20" },
  EXPIRED: { label: "Expirado", color: "text-red-300 bg-red-500/10 border-red-500/20" },
  RETURNED: { label: "Devuelto", color: "text-orange-300 bg-orange-500/10 border-orange-500/20" },
  REFUNDED: { label: "Reembolsado", color: "text-red-300 bg-red-500/10 border-red-500/20" },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function isTerminalStatus(status: string): boolean {
  return ["CANCELLED", "EXPIRED", "RETURNED", "REFUNDED"].includes(status)
}

export function OrderDetail({ order }: { order: OrderData }) {
  const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
  const terminal = isTerminalStatus(order.status)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-secondary text-white/60 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis pedidos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-purple-300/60 font-secondary mb-2">
                  Pedido
                </p>
                <h1 className="text-3xl sm:text-4xl font-primary text-white font-semibold tracking-tight">
                  {order.orderNumber}
                </h1>
              </div>

              <div className="flex flex-col sm:items-end gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium font-secondary border ${statusConfig.color}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {statusConfig.label}
                </span>
                <p className="text-sm text-white/50 font-secondary">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {!terminal && (
              <div className="pt-6 border-t border-white/[0.08]">
                <OrderStatusTimeline currentStatus={order.status} />
              </div>
            )}
          </div>

          <OrderItemsList items={order.items} />
        </div>

        <div className="space-y-6">
          <ShippingAddressCard address={order.shippingAddress} />
          <OrderSummaryCard
            subtotal={order.subtotal}
            shippingCost={order.shippingCost}
            total={order.total}
          />
        </div>
      </div>
    </div>
  )
}
