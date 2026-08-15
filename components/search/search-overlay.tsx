"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, ChevronRight, TrendingUp, X } from "lucide-react"
import { useSearch } from "./search-context"
import { ProductDTO, CategoryDTO } from "@/Interfaces/dto/product.dto"

const RECENT_SEARCHES_KEY = "titania-recent-searches"
const MAX_RECENT_SEARCHES = 5

interface SearchResults {
    products: ProductDTO[]
    categories: CategoryDTO[]
}

export default function SearchOverlay() {
    const { isOpen, close } = useSearch()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResults>({ products: [], categories: [] })
    const [popularCategories, setPopularCategories] = useState<CategoryDTO[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (stored) {
            try { setRecentSearches(JSON.parse(stored)) } catch { /* ignore */ }
        }
    }, [])

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, close])

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            // Cargar categorías populares desde la API
            fetch("/api/search")
                .then(res => res.ok ? res.json() : null)
                .then(data => { if (data?.categories) setPopularCategories(data.categories) })
                .catch(() => {})
        }
    }, [isOpen])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (query.length < 2) {
            setResults({ products: [], categories: [] })
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data)
                }
            } catch { /* ignore */ }
            setIsLoading(false)
        }, 300)

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [query])

    const saveRecentSearch = useCallback((searchTerm: string) => {
        const trimmed = searchTerm.trim()
        if (!trimmed) return
        setRecentSearches(prev => {
            const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase())
            const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
            return updated
        })
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && query.trim().length >= 2) {
            saveRecentSearch(query)
            window.location.href = `/shop?search=${encodeURIComponent(query.trim())}`
        }
    }

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={close}
            />

            <div
                className={`fixed top-14 left-0 right-0 z-50 bg-purple-950/95 backdrop-blur-md border-b border-purple-500/20 transform transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
            >
                <div className="max-w-2xl mx-auto p-6 relative">
                    {/* Close button */}
                    <button
                        onClick={close}
                        className="absolute top-6 right-6 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-purple-800/40 transition-colors cursor-pointer"
                        aria-label="Cerrar búsqueda"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <span className="font-primary text-2xl tracking-[0.2em] text-white uppercase">Titania</span>
                    </div>

                    {/* Search input */}
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar productos, categorías..."
                            className="w-full bg-purple-900/40 border border-purple-500/30 rounded-md px-4 py-3 pl-11 text-white placeholder-white/50 font-secondary text-sm focus:outline-none focus:border-purple-400 transition-colors"
                            autoFocus
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    </div>

                    <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        {/* Recent searches */}
                        {query.length === 0 && recentSearches.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]"></span>
                                    Búsquedas recientes
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((search, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(search)}
                                            className="px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-900/40 text-white/80 text-xs hover:bg-purple-800/60 transition-colors"
                                        >
                                            {search}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Popular searches */}
                        {query.length === 0 && popularCategories.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-purple-400" />
                                    Búsquedas populares
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {popularCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setQuery(cat.name)}
                                            className="px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-900/30 text-white/70 text-xs hover:bg-purple-800/50 hover:text-white transition-colors"
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.categories.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Categorías</p>
                                <div className="space-y-2">
                                    {results.categories.map(cat => (
                                        <Link
                                            key={cat.id}
                                            href={`/shop?category=${cat.slug}`}
                                            onClick={() => { close(); saveRecentSearch(cat.name) }}
                                            className="flex items-center justify-between p-3 rounded-md hover:bg-purple-900/40 transition-colors group"
                                        >
                                            <span className="text-sm text-white group-hover:text-purple-300 transition-colors">{cat.name}</span>
                                            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-purple-400" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.products.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Productos</p>
                                <div className="space-y-3">
                                    {results.products.map(product => (
                                        <Link
                                            key={product.id}
                                            href={`/product/${product.slug}`}
                                            onClick={() => { close(); saveRecentSearch(query) }}
                                            className="flex items-center gap-3 p-2 rounded-md hover:bg-purple-900/40 transition-colors"
                                        >
                                            <Image
                                                src={product.images[0]?.url || "/placeholder.svg"}
                                                alt={product.name}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-md object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{product.name}</p>
                                                <p className="text-xs text-purple-300">${product.price.toFixed(2)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                            </div>
                        )}

                        {query.length >= 2 && !isLoading && results.products.length === 0 && results.categories.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-white/60">Sin resultados para &quot;{query}&quot;</p>
                                <Link
                                    href={`/shop?search=${encodeURIComponent(query)}`}
                                    onClick={close}
                                    className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block"
                                >
                                    Ver todos los productos
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
