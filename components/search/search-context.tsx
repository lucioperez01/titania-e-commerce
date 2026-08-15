"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface SearchContextValue {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    const toggle = () => setIsOpen(prev => !prev)

    return (
        <SearchContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
        </SearchContext.Provider>
    )
}

export function useSearch() {
    const context = useContext(SearchContext)
    if (!context) {
        throw new Error("useSearch must be used within a SearchProvider")
    }
    return context
}
