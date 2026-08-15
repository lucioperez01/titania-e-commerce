"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useSearchParams } from "next/navigation"

type Category = {
  id: number
  name: string
  slug: string
}

export default function MobileMenu({ categories }: { categories: Category[] }) {
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
          <div className="absolute top-14 left-0 w-full bg-purple-900/60 backdrop-blur-md border-b border-white/10">
          <nav className="flex flex-col py-4 px-6 gap-3">
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className={`text-sm uppercase tracking-widest transition-colors font-secondary py-2 ${
                !activeCategory ? "text-white" : "text-white/80 hover:text-white"
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
          </nav>
        </div>
      )}
    </div>
  )
}
