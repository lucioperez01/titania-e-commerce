import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Activity,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Package,
    Settings,
    ShoppingCart,
    Users,
    BoxSelect,
    TrendingUp,
    TrendingDown,
    Store
} from "lucide-react";
import { getDashboardMetricsAction, getRecentOrdersAction } from "./orders/actions";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function DashboardPage() {
    const [metrics, recentOrders] = await Promise.all([
        getDashboardMetricsAction(),
        getRecentOrdersAction(10),
    ]);

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
    };

    const statusColors: Record<string, string> = {
        PENDING: "text-yellow-400",
        RESERVED: "text-blue-400",
        PAID: "text-emerald-400",
        SHIPPED: "text-purple-400",
        DELIVERED: "text-green-400",
        CANCELLED: "text-red-400",
        EXPIRED: "text-gray-400",
        RETURNED: "text-orange-400",
        REFUNDED: "text-pink-400",
    };

    return (
        <div className="flex flex-col justify-center items-center space-y-5 md:p-10 text-white animate-in fade-in duration-500 w-full">

            <div className="pt-6 flex items-center justify-center">
                <div>
                    <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent text-center">
                        Titania Dashboard
                    </h2>
                    <p className="text-white text-center">
                        Resumen del rendimiento y el inventario de tu tienda.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 w-[85%] max-w-6xl">
                <StatCard
                    title="Ingresos totales"
                    value={`$${metrics.totalSold.toLocaleString("es-AR")}`}
                    icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                    trend={`${metrics.totalOrders} órdenes pagadas`}
                    trendUp={true}
                />
                <StatCard
                    title="Ticket promedio"
                    value={`$${Math.round(metrics.avgTicket).toLocaleString("es-AR")}`}
                    icon={<CreditCard className="w-4 h-4 text-cyan-400" />}
                    trend="Promedio por venta"
                    trendUp={true}
                />
                <StatCard
                    title="Pedidos activos"
                    value={`${metrics.totalOrders}`}
                    icon={<Activity className="w-4 h-4 text-indigo-400" />}
                    trend="Total de ventas"
                    trendUp={true}
                />
                <StatCard
                    title="Clientes recurrentes"
                    value={`${metrics.repeatCustomers}`}
                    icon={<Users className="w-4 h-4 text-purple-400" />}
                    trend="Compraron más de 1 vez"
                    trendUp={true}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 justify-center items-start">
                <div className="col-span-4 rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-purple-800/30">
                        <div className="space-y-1">
                            <h3 className="font-semibold leading-none tracking-tight text-lg text-white">Ordenes recientes</h3>
                            <p className="text-sm text-slate-300">Últimos {recentOrders.length} pedidos.</p>
                        </div>
                        <Link href="/dashboard/orders">
                            <Button variant="outline" className="font-secondary font-extrabold text-slate-300 border-neutral-700 hover:cursor-pointer gap-2">
                                Ver todas <ArrowUpRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-6 space-y-4">
                        {recentOrders.length === 0 ? (
                            <EmptyState
                                icon={ShoppingCart}
                                title="No hay pedidos todavía"
                                description="Cuando recibas pedidos, aparecerán aquí con todos los detalles"
                                action={{ label: "Ver productos", href: "/dashboard/products" }}
                                variant="compact"
                            />
                        ) : (
                            recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/dashboard/orders/${order.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 relative flex items-center justify-center rounded-full bg-neutral-800 border border-slate-700 overflow-hidden shadow-inner">
                                            <span className="font-semibold text-slate-300">{order.fullName[0]}</span>
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <p className="text-sm font-medium leading-none text-white group-hover:text-purple-400 transition-colors">{order.fullName}</p>
                                            <p className="text-xs text-slate-300">{order.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-white">${Number(order.total).toLocaleString("es-AR")}</div>
                                        <div className={`text-xs ${statusColors[order.status]}`}>
                                            {statusLabels[order.status]}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <div className="grid col-span-4 md:col-span-4 lg:col-span-3 gap-6 justify-center items-start">
                    <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
                        <div className="pb-4">
                            <h3 className="font-semibold leading-none tracking-tight text-lg text-white">Administrador de Inventario</h3>
                            <p className="text-sm text-slate-300 mt-1">Acciones rápidas para tu tienda.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <QuickActionCard
                                icon={<BoxSelect className="w-5 h-5 text-rose-400" />}
                                label="Productos"
                                description="Gestionar productos"
                                href="/dashboard/products"
                            />
                            <QuickActionCard
                                icon={<Settings className="w-5 h-5 text-neutral-400" />}
                                label="Categorias"
                                description="Gestionar categorias"
                                href="/dashboard/categories"
                            />
                            <QuickActionCard
                                icon={<Store className="w-5 h-5 text-amber-400" />}
                                label="Ir a la tienda"
                                description="Ver tu tienda online"
                                href="/"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
                        <div className="space-y-1 pb-4 border-b border-purple-800/30">
                            <h3 className="font-semibold leading-none tracking-tight text-lg text-white">Top Products</h3>
                            <p className="text-sm text-slate-300">Productos más vendidos.</p>
                        </div>
                        <div className="mt-4 space-y-4">
                            {metrics.bestSellers.length === 0 ? (
                                <EmptyState
                                    icon={TrendingUp}
                                    title="Sin ventas todavía"
                                    description="Tus productos más vendidos aparecerán aquí"
                                    variant="compact"
                                />
                            ) : (
                                metrics.bestSellers.map((product, i) => (
                                    <div key={product.productId} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-neutral-800/40 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-neutral-800 border border-neutral-700 shadow-sm">
                                                <Package className="w-4 h-4 text-neutral-300 group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{product.productName}</p>
                                                <p className="text-xs text-slate-300">{product.quantity} ventas — ${product.revenue.toLocaleString("es-AR")}</p>
                                            </div>
                                        </div>
                                        <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
                        <div className="space-y-1 pb-4 border-b border-purple-800/30">
                            <h3 className="font-semibold leading-none tracking-tight text-lg text-white">Worst Sellers</h3>
                            <p className="text-sm text-slate-300">Productos con menos ventas.</p>
                        </div>
                        <div className="mt-4 space-y-4">
                            {metrics.worstSellers.length === 0 ? (
                                <EmptyState
                                    icon={TrendingDown}
                                    title="Sin datos todavía"
                                    description="Los productos con menos ventas se mostrarán aquí"
                                    variant="compact"
                                />
                            ) : (
                                metrics.worstSellers.map((product) => (
                                    <div key={product.productId} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-neutral-800/40 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-neutral-800 border border-neutral-700 shadow-sm">
                                                <Package className="w-4 h-4 text-neutral-300 group-hover:text-rose-400 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{product.productName}</p>
                                                <p className="text-xs text-slate-300">{product.quantity} ventas — ${product.revenue.toLocaleString("es-AR")}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
    return (
        <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl p-6 flex flex-col justify-between hover:bg-neutral-800/40 transition-all cursor-default">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-slate-300">{title}</h3>
                {icon}
            </div>
            <div>
                <div className="text-3xl font-bold text-white">{value}</div>
                <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
}

function QuickActionCard({ icon, label, description, href }: { icon: React.ReactNode, label: string, description: string, href: string }) {
    return (
        <Link href={href} className="flex flex-col items-center p-4 rounded-xl border border-purple-400/25 bg-purple-400/20 hover:bg-purple-900/20 hover:border-purple-400 transition-all text-left shadow-sm group cursor-pointer text-center">
            <div className="p-2 rounded-lg bg-neutral-800 group-hover:scale-110 transition-transform shadow-inner">
                {icon}
            </div>
            <span className="text-sm font-medium text-white">{label}</span>
            <span className="text-xs text-slate-300">{description}</span>
        </Link>
    );
}
