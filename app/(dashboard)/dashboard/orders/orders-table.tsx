'use client'

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, ChevronDown, Package, MapPin, CreditCard } from "lucide-react"
import type { OrderStatus } from "@prisma/client"

interface Order {
    id: number
    email: string
    fullName: string
    total: number
    status: OrderStatus
    createdAt: Date
    itemCount: number
}

interface OrdersTableProps {
    orders: Order[]
    statusLabels: Record<string, string>
    statusColors: Record<string, string>
}

export function OrdersTable({ orders, statusLabels, statusColors }: OrdersTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null)

    function toggleRow(id: number) {
        setExpandedId(expandedId === id ? null : id)
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-white">No hay pedidos</h3>
                <p className="text-sm text-slate-300 mt-1">
                    Los pedidos aparecerán aquí cuando se realicen
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-purple-400/20 text-left">
                        <th className="pb-3 w-8"></th>
                        <th className="pb-3 text-xs font-medium text-slate-300 uppercase tracking-wider">ID</th>
                        <th className="pb-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Cliente</th>
                        <th className="pb-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Total</th>
                        <th className="pb-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Items</th>
                        <th className="pb-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Estado</th>
                        <th className="pb-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Fecha</th>
                        <th className="pb-3 text-xs font-medium text-slate-300 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-purple-400/10">
                    {orders.map((order) => {
                        const isExpanded = expandedId === order.id
                        return (
                            <OrderRow
                                key={order.id}
                                order={order}
                                isExpanded={isExpanded}
                                onToggle={() => toggleRow(order.id)}
                                statusLabels={statusLabels}
                                statusColors={statusColors}
                            />
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function OrderRow({
    order,
    isExpanded,
    onToggle,
    statusLabels,
    statusColors,
}: {
    order: Order
    isExpanded: boolean
    onToggle: () => void
    statusLabels: Record<string, string>
    statusColors: Record<string, string>
}) {
    return (
        <>
            <tr
                className={`cursor-pointer transition-colors ${
                    isExpanded ? "bg-neutral-800/40" : "hover:bg-neutral-800/40"
                }`}
                onClick={onToggle}
            >
                <td className="py-3 pr-2">
                    <button
                        className="text-slate-300 hover:text-white transition-colors"
                        aria-label={isExpanded ? "Contraer fila" : "Expandir fila"}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                </td>
                <td className="py-3 text-sm font-mono text-white">#{order.id}</td>
                <td className="py-3">
                    <div>
                        <p className="text-sm font-medium text-white">{order.fullName}</p>
                        <p className="text-xs text-slate-300">{order.email}</p>
                    </div>
                </td>
                <td className="py-3 text-sm font-semibold text-white">
                    ${order.total.toLocaleString("es-AR")}
                </td>
                <td className="py-3 text-sm text-slate-300">{order.itemCount}</td>
                <td className="py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                    </span>
                </td>
                <td className="py-3 text-sm text-slate-300">
                    {order.createdAt.toLocaleDateString("es-AR")}
                </td>
                <td className="py-3">
                    <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Ver
                    </Link>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-neutral-800/30">
                    <td colSpan={8} className="px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-3 text-sm">
                            <div className="flex items-start gap-2">
                                <Package className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-300 uppercase tracking-wider">Items</p>
                                    <p className="text-white">{order.itemCount} productos</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-300 uppercase tracking-wider">Email</p>
                                    <p className="text-white">{order.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CreditCard className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-300 uppercase tracking-wider">Total</p>
                                    <p className="text-white font-semibold">
                                        ${order.total.toLocaleString("es-AR")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}
