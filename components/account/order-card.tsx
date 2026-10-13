"use client"

import Link from "next/link"
import { MapPin, Package, ArrowRight } from "lucide-react"
import type { OrderSummary } from "@/app/(store)/account/actions"
import { OrderStatusTimeline } from "./order-status-timeline"

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; glow: string }> = {
  PENDING: { label: "Pendiente", dot: "bg-zinc-400", bg: "bg-zinc-500/10", text: "text-zinc-300", glow: "" },
  RESERVED: { label: "Reservado", dot: "bg-amber-400", bg: "bg-amber-500/10", text: "text-amber-300", glow: "shadow-amber-500/20" },
  PAID: { label: "Pagado", dot: "bg-blue-400", bg: "bg-blue-500/10", text: "text-blue-300", glow: "shadow-blue-500/20" },
  SHIPPED: { label: "Enviado", dot: "bg-indigo-400", bg: "bg-indigo-500/10", text: "text-indigo-300", glow: "shadow-indigo-500/20" },
  DELIVERED: { label: "Entregado", dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-300", glow: "shadow-emerald-500/20" },
  CANCELLED: { label: "Cancelado", dot: "bg-red-400", bg: "bg-red-500/10", text: "text-red-300", glow: "" },
  EXPIRED: { label: "Expirado", dot: "bg-red-400", bg: "bg-red-500/10", text: "text-red-300", glow: "" },
  RETURNED: { label: "Devuelto", dot: "bg-orange-400", bg: "bg-orange-500/10", text: "text-orange-300", glow: "" },
  REFUNDED: { label: "Reembolsado", dot: "bg-red-400", bg: "bg-red-500/10", text: "text-red-300", glow: "" },
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function isTerminalStatus(status: string): boolean {
  return ["CANCELLED", "EXPIRED", "RETURNED", "REFUNDED"].includes(status)
}

export function OrderCard({ order }: { order: OrderSummary }) {
  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
  const terminal = isTerminalStatus(order.status)

  return (
    <div className="group relative bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.10] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/5">
      <div className="flex flex-col gap-5">
        {/* Header: order number + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-purple-300/60 font-secondary mb-1">
              Pedido
            </p>
            <p className="text-lg font-primary text-white font-medium">
              {order.orderNumber}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-secondary ${config.bg} ${config.text} border border-white/[0.06] ${config.glow} ${!terminal && order.status !== "PENDING" ? "shadow-sm" : ""}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${!terminal && order.status !== "PENDING" ? "animate-pulse" : ""}`} />
            {config.label}
          </span>
        </div>

        {/* Date + location + items */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/50 font-secondary">
          <span>{formatDate(order.createdAt)}</span>
          <span className="hidden sm:inline text-white/20">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {order.city}, {order.province}
          </span>
          <span className="hidden sm:inline text-white/20">·</span>
          <span className="inline-flex items-center gap-1">
            <Package className="w-3 h-3" />
            {order.itemCount} {order.itemCount === 1 ? "producto" : "productos"}
          </span>
        </div>

        {/* Status timeline — only for active orders */}
        {!terminal && (
          <div className="hidden sm:block">
            <OrderStatusTimeline currentStatus={order.status} />
          </div>
        )}

        {/* Footer: total + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-purple-300/60 font-secondary mb-0.5">
              Total
            </p>
            <p className="text-xl font-primary text-white font-semibold">
              ${order.total.toLocaleString("es-AR")}
            </p>
          </div>

          <Link
            href={`/account/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-secondary text-purple-300/80 hover:text-white transition-colors group/link"
          >
            Ver detalle
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
