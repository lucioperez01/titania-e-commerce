'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingCart,
    BarChart3,
    Package,
    Tags,
    Store,
    type LucideIcon,
} from "lucide-react"

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
}

interface NavSection {
    title: string
    items: NavItem[]
}

const navSections: NavSection[] = [
    {
        title: "Ventas",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart },
            { label: "Estadísticas", href: "/dashboard/statistics", icon: BarChart3 },
        ],
    },
    {
        title: "Inventario",
        items: [
            { label: "Productos", href: "/dashboard/products", icon: Package },
            { label: "Categorías", href: "/dashboard/categories", icon: Tags },
        ],
    },
]

export function Sidebar() {
    const pathname = usePathname()

    function isActive(href: string) {
        return href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === href || pathname.startsWith(`${href}/`)
    }

    return (
        <aside className="fixed top-0 left-0 z-30 hidden md:flex h-screen w-64 flex-col border-r border-purple-400/20 bg-neutral-900/40 backdrop-blur-xl">
            <div className="flex h-16 items-center border-b border-purple-400/20 px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                        <Store className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">Titania</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-6">
                {navSections.map((section, idx) => (
                    <div key={section.title} className={idx > 0 ? "mt-6" : ""}>
                        <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {section.title}
                        </h3>
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const active = isActive(item.href)
                                const Icon = item.icon
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? "page" : undefined}
                                            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                                                active
                                                    ? "bg-purple-600/20 text-white border-l-2 border-purple-400"
                                                    : "text-slate-300 hover:bg-purple-500/10 hover:text-white"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="border-t border-purple-400/20 p-3">
                <Link
                    href="/shop"
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-purple-500/10 hover:text-white"
                >
                    <Store className="h-4 w-4 shrink-0" />
                    <span>Ir a la tienda</span>
                </Link>
            </div>
        </aside>
    )
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname()

    function isActive(href: string) {
        return href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === href || pathname.startsWith(`${href}/`)
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900/95 backdrop-blur-xl border-r border-purple-400/20">
                <div className="flex h-16 items-center justify-between border-b border-purple-400/20 px-6">
                    <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                            <Store className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">Titania</span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="overflow-y-auto px-3 py-6 h-[calc(100vh-4rem)]">
                    {navSections.map((section, idx) => (
                        <div key={section.title} className={idx > 0 ? "mt-6" : ""}>
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {section.title}
                            </h3>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const active = isActive(item.href)
                                    const Icon = item.icon
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                aria-current={active ? "page" : undefined}
                                                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                                                    active
                                                        ? "bg-purple-600/20 text-white border-l-2 border-purple-400"
                                                        : "text-slate-300 hover:bg-purple-500/10 hover:text-white"
                                                }`}
                                            >
                                                <Icon className="h-4 w-4 shrink-0" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}

                    <div className="mt-6 border-t border-purple-400/20 pt-4">
                        <Link
                            href="/shop"
                            onClick={onClose}
                            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-purple-500/10 hover:text-white"
                        >
                            <Store className="h-4 w-4 shrink-0" />
                            <span>Ir a la tienda</span>
                        </Link>
                    </div>
                </nav>
            </aside>
        </div>
    )
}
