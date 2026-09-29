import { getOrdersAction, getOrderStatusCountsAction } from "./actions"
import { OrderStatus } from "@prisma/client"
import { Package, Search, Download } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { OrdersTable } from "./orders-table"
import { OrdersFilters } from "./orders-filters"

interface OrdersPageProps {
    searchParams: Promise<{
        status?: string
        email?: string
        page?: string
        dateFrom?: string
        dateTo?: string
    }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const params = await searchParams
    const page = parseInt(params.page ?? "1", 10)
    const status = params.status as OrderStatus | undefined
    const email = params.email
    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined
    const dateTo = params.dateTo ? new Date(params.dateTo) : undefined

    const [ordersResult, statusCounts] = await Promise.all([
        getOrdersAction({ page, status, email, dateFrom, dateTo }),
        getOrderStatusCountsAction(),
    ])

    const statusLabels: Record<OrderStatus, string> = {
        PENDING: "Pendiente",
        RESERVED: "Reservado",
        PAID: "Pagado",
        SHIPPED: "Enviado",
        DELIVERED: "Entregado",
        CANCELLED: "Cancelado",
        EXPIRED: "Expirado",
        RETURNED: "Devuelto",
        REFUNDED: "Reembolsado",
    }

    const statusColors: Record<OrderStatus, string> = {
        PENDING: "bg-yellow-500/20 text-yellow-400",
        RESERVED: "bg-blue-500/20 text-blue-400",
        PAID: "bg-emerald-500/20 text-emerald-400",
        SHIPPED: "bg-purple-500/20 text-purple-400",
        DELIVERED: "bg-green-500/20 text-green-400",
        CANCELLED: "bg-red-500/20 text-red-400",
        EXPIRED: "bg-gray-500/20 text-gray-400",
        RETURNED: "bg-orange-500/20 text-orange-400",
        REFUNDED: "bg-pink-500/20 text-pink-400",
    }

    const totalCount = statusCounts.reduce((sum, s) => sum + s.count, 0)

    return (
        <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Pedidos</h1>
                    <p className="text-sm text-slate-300 mt-1">
                        Gestión y seguimiento de órdenes
                    </p>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700">
                    <Download className="h-4 w-4" />
                    Exportar
                </button>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                <div className="p-6 pb-0">
                    <nav className="flex gap-1 border-b border-purple-400/20 overflow-x-auto">
                        <StatusTab
                            label="Todos"
                            count={totalCount}
                            href="/dashboard/orders"
                            active={!status}
                        />
                        {statusCounts.map(({ status: s, count }) => (
                            <StatusTab
                                key={s}
                                label={statusLabels[s]}
                                count={count}
                                href={`/dashboard/orders?status=${s}`}
                                active={status === s}
                            />
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    <OrdersFilters
                        currentStatus={status}
                        currentEmail={email}
                        currentDateFrom={params.dateFrom}
                        currentDateTo={params.dateTo}
                        statusLabels={statusLabels}
                    />

                    <OrdersTable
                        orders={ordersResult.orders}
                        statusLabels={statusLabels}
                        statusColors={statusColors}
                    />

                    {ordersResult.orders.length === 0 && (
                        status || email || dateFrom || dateTo ? (
                            <EmptyState
                                icon={Search}
                                title="No se encontraron pedidos"
                                description="No hay pedidos que coincidan con los filtros seleccionados"
                                action={{ label: "Limpiar filtros", href: "/dashboard/orders" }}
                            />
                        ) : (
                            <EmptyState
                                icon={Package}
                                title="No hay pedidos todavía"
                                description="Cuando recibas pedidos, aparecerán aquí con todos los detalles"
                                action={{ label: "Ver productos", href: "/dashboard/products" }}
                            />
                        )
                    )}

                    {ordersResult.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-purple-400/10">
                            {Array.from({ length: ordersResult.totalPages }, (_, i) => i + 1).map((p) => (
                                <a
                                    key={p}
                                    href={`/dashboard/orders?page=${p}${status ? `&status=${status}` : ""}${email ? `&email=${email}` : ""}`}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                        p === page
                                            ? "bg-purple-600 text-white"
                                            : "bg-neutral-800 text-slate-300 hover:bg-neutral-700"
                                    }`}
                                >
                                    {p}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatusTab({
    label,
    count,
    href,
    active,
}: {
    label: string
    count: number
    href: string
    active: boolean
}) {
    return (
        <a
            href={href}
            className={`flex items-center gap-2 whitespace-nowrap px-4 pb-3 text-sm font-medium transition-colors border-b-2 ${
                active
                    ? "text-white border-purple-400"
                    : "text-slate-300 border-transparent hover:text-slate-300"
            }`}
        >
            {label}
            <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                    active
                        ? "bg-purple-600/20 text-purple-300"
                        : "bg-neutral-800 text-slate-300"
                }`}
            >
                {count}
            </span>
        </a>
    )
}
