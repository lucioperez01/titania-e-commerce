"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, User } from "lucide-react"

const NAV_ITEMS = [
  { href: "/account/orders", label: "Mis Pedidos", icon: Package },
  { href: "/account/profile", label: "Perfil", icon: User },
]

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar — desktop */}
        <aside className="lg:w-56 shrink-0">
          <nav className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-2 lg:sticky lg:top-20">
            <div className="flex lg:flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-secondary transition-all duration-300 ${
                      isActive
                        ? "bg-white/[0.10] text-white border border-white/[0.12]"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.06] border border-transparent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
