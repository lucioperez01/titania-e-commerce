"use client"

import { Search } from "lucide-react"
import { useSearch } from "./search-context"

export default function SearchButton() {
    const { open } = useSearch()

    return (
        <button
            onClick={open}
            className="flex items-center cursor-pointer"
            aria-label="Buscar"
        >
            <Search className="w-5 h-5 text-white" />
        </button>
    )
}
