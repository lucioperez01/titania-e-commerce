"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, LayoutDashboard, Store, LogOut } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { signOut } from "next-auth/react"

type Category = {
  id: number
  name: string
  slug: string
}

type MobileMenuProps = {
  categories: Category[]
  isAdmin: boolean
  userEmail?: string
}

export default function MobileMenu({ categories, isAdmin, userEmail }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category")

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center text-white/80 hover:text-white transition-colors"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
          <div className="absolute top-14 left-0 w-full bg-purple-950/90 backdrop-blur-lg border-b border-white/10">
          <nav className="flex flex-col py-4 px-6 gap-3">
            {/* User info */}
            {userEmail && (
              <div className="pb-3 border-b border-white/10">
                <p className="text-xs text-white/50 font-secondary truncate">{userEmail}</p>
              </div>
            )}

            {/* Account actions */}
            <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
              {isAdmin && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-sm uppercase tracking-widest transition-colors font-secondary py-2 text-white/80 hover:text-white"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Gestionar
                </Link>
              )}
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className={`text-sm uppercase tracking-widest transition-colors font-secondary py-2 ${
                  !activeCategory ? "text-white font-medium" : "text-white/80 hover:text-white"
                }`}
              >
                Shop
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className={`text-sm uppercase tracking-widest transition-colors font-secondary py-2 ${
                    activeCategory === cat.slug ? "text-white font-medium" : "text-white/80 hover:text-white"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Logout */}
            {userEmail && (
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/" })
                  setOpen(false)
                }}
                className="flex items-center gap-2 text-sm uppercase tracking-widest transition-colors font-secondary py-2 text-white/60 hover:text-white cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
