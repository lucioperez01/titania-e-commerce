'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Tags } from "lucide-react"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Productos", icon: Package },
    { href: "/dashboard/categories", label: "Categorías", icon: Tags },
]

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname()

    return (
        <div className="w-full flex flex-col md:flex-row min-h-screen gap-5">
            <aside className="w-full md:w-64 shrink-0 p-6 border-b md:border-b-0 md:border-r border-white/10">
                <nav className="flex md:flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname === item.href || pathname.startsWith(`${item.href}/`)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                    ${isActive
                                        ? "bg-purple-600/40 text-white font-semibold"
                                        : "text-slate-300 hover:bg-purple-600/20 hover:text-white"
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </aside>
            <main className="flex-1 w-full max-w-[90%] mx-auto md:mx-0 md:max-w-none">
                {children}
            </main>
        </div>
    )
}
