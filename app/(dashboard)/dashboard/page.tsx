import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Activity,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Package,
    PackagePlus,
    Settings,
    ShoppingCart,
    TrendingUp,
    Users,
    BoxSelect,
    Edit
} from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="flex flex-col justify-center items-center space-y-5 md:p-10 text-white animate-in fade-in duration-500 w-full">

            {/* Header Section */}
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

            {/* Top Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 w-[85%] max-w-6xl">
                {/* <IncomeGraph /> */}
                <StatCard
                    title="Ingresos totales"
                    value="$455,231.89"
                    icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                    trend="+10.1% del mes pasado"
                    trendUp={true}
                />
                <StatCard
                    title="Ventas"
                    value="+3"
                    icon={<CreditCard className="w-4 h-4 text-cyan-400" />}
                    trend="+35% del mes pasado"
                    trendUp={true}
                />
                <StatCard
                    title="Pedidos activos"
                    value="+5"
                    icon={<Activity className="w-4 h-4 text-indigo-400" />}
                    trend="+19% del mes pasado"
                    trendUp={true}
                />
                <StatCard
                    title="Clientes activos"
                    value="+573"
                    icon={<Users className="w-4 h-4 text-purple-400" />}
                    trend="+201 del mes pasado"
                    trendUp={true}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 justify-center items-center">
                {/* Main Content Area (Left 4 cols) */}
                <div className="col-span-4 rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-purple-800/30">
                        <div className="space-y-1">
                            <h3 className="font-semibold leading-none tracking-tight text-lg">Ordenes recientes</h3>
                            <p className="text-md text-slate-200">Hiciste <span className="text-purple-400 font-semibold">10 ventas</span> este mes.</p>
                        </div>
                        <Button variant="outline" className="font-secondary font-extrabold text-slate-600 border-neutral-700 hover:cursor-pointer gap-2">
                            Ver todas <ArrowUpRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className=" mt-6 space-y-6">
                        {[
                            { name: "Liam Johnson", email: "liam@example.com", amount: "+$1,999.00", status: "Completed" },
                            { name: "Olivia Smith", email: "olivia@example.com", amount: "+$39.00", status: "Processing" },
                            { name: "Noah Williams", email: "noah@example.com", amount: "+$299.00", status: "Completed" },
                            { name: "Emma Brown", email: "emma@example.com", amount: "+$99.00", status: "Completed" },
                            { name: "William Jones", email: "will@example.com", amount: "+$150.00", status: "Processing" },
                        ].map((order, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-500/30 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 relative flex items-center justify-center rounded-full bg-neutral-800 border border-slate-700 overflow-hidden shadow-inner">
                                        <span className="font-semibold text-slate-300">{order.name[0]}</span>
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <p className="text-sm font-medium leading-none group-hover:text-purple-400 transition-colors">{order.name}</p>
                                        <p className="text-xs text-slate-300">{order.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">{order.amount}</div>
                                    <div className={`text-xs ${order.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {order.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side Panel (Right 3 cols) */}
                <div className="grid col-span-4 md:col-span-4 lg:col-span-3 gap-4 justify-center items-center">
                    {/* Inventory Actions Card */}
                    <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
                        <div className="p-2 pb-4">
                            <h3 className="font-semibold leading-none tracking-tight text-lg">Administrador de Inventario</h3>
                            <p className="text-sm text-slate-300">Acciones rápidas para tu tienda.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
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
                                icon={<Settings className="w-5 h-5 text-neutral-400" />}
                                label="Estadísticas"
                                description="Ver estadísticas"
                                href="/dashboard/statistics"
                            />
                        </div>
                    </div>

                    {/* Top Products Card */}
                    <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl mb-5">
                        <div className="space-y-1 pb-4 border-b border-purple-800/30">
                            <h3 className="font-semibold leading-none tracking-tight text-lg">Top Products</h3>
                            <p className="text-sm text-slate-200">Productos más vendidos.</p>
                        </div>
                        <div className="mt-4 space-y-4">
                            {[
                                { name: "Lenter rayban", sales: "1,234", icon: <ShoppingCart className="w-4 h-4 text-cyan-400" /> },
                                { name: "Cartera chanel", sales: "856", icon: <ShoppingCart className="w-4 h-4 text-indigo-400" /> },
                                { name: "Zapatos gucci", sales: "432", icon: <ShoppingCart className="w-4 h-4 text-emerald-400" /> },
                            ].map((product, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-neutral-800/40 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-neutral-800 border border-neutral-700 shadow-sm">
                                            <Package className="w-4 h-4 text-neutral-300 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{product.name}</p>
                                            <p className="text-xs text-slate-200">{product.sales} ventas</p>
                                        </div>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponents for the Dashboard Page to keep it modular
function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
    return (
        <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm shadow-xl p-6 flex flex-col justify-between hover:bg-neutral-800/60 transition-all cursor-default">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-neutral-300">{title}</h3>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{value}</div>
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