"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

type Category = {
    id: number
    name: string
    slug: string
}

export default function CategoryNav({ categories }: { categories: Category[] }) {
    const searchParams = useSearchParams()
    const activeCategory = searchParams.get("category")

    return (
        <nav className="hidden md:flex flex-1 justify-center items-center gap-6">
            <Link
                href="/shop"
                className={`flex items-center text-[11px] uppercase tracking-[0.2em] transition-colors font-secondary ${
                    !activeCategory ? "text-white" : "text-white/70 hover:text-white"
                }`}
            >
                Shop
            </Link>
            {categories.map((cat) => (
                <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className={`flex items-center text-[11px] uppercase tracking-[0.2em] transition-colors font-secondary ${
                        activeCategory === cat.slug ? "text-white font-medium" : "text-white/70 hover:text-white"
                    }`}
                >
                    {cat.name}
                </Link>
            ))}
        </nav>
    )
}
