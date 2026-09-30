import Link from "next/link"
import {
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Package,
    ShoppingCart,
    Users,
    TrendingUp,
    TrendingDown,
    Award,
    AlertTriangle,
    Calendar,
    CalendarCheck,
} from "lucide-react"
import { getDashboardMetricsAction, getRecentOrdersAction, getWeeklyIncomeAction } from "./orders/actions"
import { EmptyState } from "@/components/dashboard/empty-state"
import { StatCard } from "@/components/dashboard/stat-card"
import IncomeGraph from "./graph/incomegraph"
import { PerformanceTabs } from "./performance-tabs"

export default async function DashboardPage() {
    const [metrics, recentOrders, weeklyIncome] = await Promise.all([
        getDashboardMetricsAction(),
        getRecentOrdersAction(10),
        getWeeklyIncomeAction(),
    ])

    const statusLabels: Record<string, string> = {
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

    const statusColors: Record<string, string> = {
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

    const today = new Date().toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    return (
        <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Dashboard
                    </h1>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="capitalize">{today}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2 lg:row-span-2">
                    <StatCard
                        title="Ingresos Totales"
                        value={`$${metrics.totalSold.toLocaleString("es-AR")}`}
                        icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
                        trend={{ value: 12, label: "vs mes anterior" }}
                        variant="hero"
                    />
                </div>
                <StatCard
                    title="Ticket Promedio"
                    value={`$${Math.round(metrics.avgTicket).toLocaleString("es-AR")}`}
                    icon={<CreditCard className="h-4 w-4 text-cyan-400" />}
                    trend={{ value: 5, label: "por venta" }}
                />
                <StatCard
                    title="Pedidos Activos"
                    value={metrics.totalOrders}
                    icon={<ShoppingCart className="h-4 w-4 text-indigo-400" />}
                    trend={{ value: 8, label: "total ventas" }}
                />
                <StatCard
                    title="Clientes Recurrentes"
                    value={metrics.repeatCustomers}
                    icon={<Users className="h-4 w-4 text-purple-400" />}
                    trend={{ value: 3, label: "+1 vez" }}
                />
                <StatCard
                    title="Ventas Hoy"
                    value={`$${metrics.todaySales.toLocaleString("es-AR")}`}
                    icon={<CalendarCheck className="h-5 w-5 text-purple-400" />}
                    trend={{ value: 0, label: "hoy" }}
                    variant="secondary"
                />
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Ingresos Semanales</h3>
                        <p className="text-sm text-slate-300">Últimos 7 días</p>
                    </div>
                </div>
                <div className="h-64">
                    <IncomeGraph data={weeklyIncome} />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between border-b border-purple-400/20 p-6 pb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Órdenes Recientes</h3>
                            <p className="text-sm text-slate-300">Últimos {recentOrders.length} pedidos</p>
                        </div>
                        <Link
                            href="/dashboard/orders"
                            className="flex items-center gap-1 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            Ver todas <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="divide-y divide-purple-400/10">
                        {recentOrders.length === 0 ? (
                            <EmptyState
                                icon={ShoppingCart}
                                title="No hay pedidos todavía"
                                description="Cuando recibas pedidos, aparecerán aquí"
                                action={{ label: "Ver productos", href: "/dashboard/products" }}
                                variant="compact"
                            />
                        ) : (
                            recentOrders.slice(0, 5).map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/dashboard/orders/${order.id}`}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-neutral-800/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 border border-slate-700">
                                            <span className="text-sm font-semibold text-slate-300">
                                                {order.fullName[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                                                {order.fullName}
                                            </p>
                                            <p className="text-xs text-slate-300">
                                                #{order.id} — {order.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-white">
                                            ${Number(order.total).toLocaleString("es-AR")}
                                        </p>
                                        <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                                            {statusLabels[order.status]}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                    <PerformanceTabs
                        bestSellers={metrics.bestSellers}
                        worstSellers={metrics.worstSellers}
                    />
                </div>
            </div>
        </div>
    )
}
