'use client'

import { useRouter } from "next/navigation"
import type { OrderStatus } from "@prisma/client"
import { FilterChips } from "@/components/dashboard/filter-chips"

interface OrdersFiltersProps {
    currentStatus?: OrderStatus
    currentEmail?: string
    currentDateFrom?: string
    currentDateTo?: string
    statusLabels: Record<string, string>
}

export function OrdersFilters({
    currentStatus,
    currentEmail,
    currentDateFrom,
    currentDateTo,
    statusLabels,
}: OrdersFiltersProps) {
    const router = useRouter()

    const chips: { label: string; value: string; onRemove: () => void }[] = []

    if (currentStatus) {
        chips.push({
            label: "Estado",
            value: statusLabels[currentStatus],
            onRemove: () => {
                const params = new URLSearchParams()
                if (currentEmail) params.set("email", currentEmail)
                if (currentDateFrom) params.set("dateFrom", currentDateFrom)
                if (currentDateTo) params.set("dateTo", currentDateTo)
                router.push(`/dashboard/orders?${params.toString()}`)
            },
        })
    }

    if (currentEmail) {
        chips.push({
            label: "Email",
            value: currentEmail,
            onRemove: () => {
                const params = new URLSearchParams()
                if (currentStatus) params.set("status", currentStatus)
                if (currentDateFrom) params.set("dateFrom", currentDateFrom)
                if (currentDateTo) params.set("dateTo", currentDateTo)
                router.push(`/dashboard/orders?${params.toString()}`)
            },
        })
    }

    if (currentDateFrom) {
        chips.push({
            label: "Desde",
            value: new Date(currentDateFrom).toLocaleDateString("es-AR"),
            onRemove: () => {
                const params = new URLSearchParams()
                if (currentStatus) params.set("status", currentStatus)
                if (currentEmail) params.set("email", currentEmail)
                if (currentDateTo) params.set("dateTo", currentDateTo)
                router.push(`/dashboard/orders?${params.toString()}`)
            },
        })
    }

    if (currentDateTo) {
        chips.push({
            label: "Hasta",
            value: new Date(currentDateTo).toLocaleDateString("es-AR"),
            onRemove: () => {
                const params = new URLSearchParams()
                if (currentStatus) params.set("status", currentStatus)
                if (currentEmail) params.set("email", currentEmail)
                if (currentDateFrom) params.set("dateFrom", currentDateFrom)
                router.push(`/dashboard/orders?${params.toString()}`)
            },
        })
    }

    return (
        <div className="mb-6">
            <form className="flex flex-wrap gap-3 mb-4" method="GET" action="/dashboard/orders">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-300 font-medium">Estado</label>
                    <select
                        name="status"
                        defaultValue={currentStatus ?? ""}
                        className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                    >
                        <option value="">Todos</option>
                        {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-300 font-medium">Email</label>
                    <input
                        type="text"
                        name="email"
                        defaultValue={currentEmail ?? ""}
                        placeholder="buscar@email.com"
                        className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-300 font-medium">Desde</label>
                    <input
                        type="date"
                        name="dateFrom"
                        defaultValue={currentDateFrom ?? ""}
                        className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-300 font-medium">Hasta</label>
                    <input
                        type="date"
                        name="dateTo"
                        defaultValue={currentDateTo ?? ""}
                        className="bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Filtrar
                    </button>
                </div>

                {(currentStatus || currentEmail || currentDateFrom || currentDateTo) && (
                    <div className="flex items-end">
                        <a
                            href="/dashboard/orders"
                            className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Limpiar
                        </a>
                    </div>
                )}
            </form>

            <FilterChips
                chips={chips}
                onClearAll={() => router.push("/dashboard/orders")}
            />
        </div>
    )
}
