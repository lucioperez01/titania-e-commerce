'use client'

import { useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { PromotionDTO } from "@/Interfaces/dto/promotion.dto"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import PromotionModal from "@/components/dashboard/promotion-modal"
import { Button } from "@/components/ui/button"
import {
    createPromotionAction,
    updatePromotionAction,
    deletePromotionAction,
    togglePromotionAction,
} from "@/app/(dashboard)/actions"
import { Ticket, Plus } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"

type Props = {
    promotions: PromotionDTO[]
    products: ProductDTO[]
    total: number
    page: number
}

const STATUS_TABS = [
    { label: "Todas", value: "", href: "/dashboard/promotions" },
    { label: "Activas", value: "ACTIVE" },
    { label: "Expiradas", value: "EXPIRED" },
    { label: "Programadas", value: "SCHEDULED" },
] as const

function formatDate(iso: string | null): string {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        ACTIVE: "bg-emerald-500/20 text-emerald-400",
        EXPIRED: "bg-red-500/20 text-red-400",
        SCHEDULED: "bg-yellow-500/20 text-yellow-400",
        INACTIVE: "bg-slate-500/20 text-slate-400",
    }
    const labels: Record<string, string> = {
        ACTIVE: "Activa",
        EXPIRED: "Expirada",
        SCHEDULED: "Programada",
        INACTIVE: "Inactiva",
    }
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${map[status] ?? map.INACTIVE}`}>
            {labels[status] ?? "Inactiva"}
        </span>
    )
}

function benefitSummary(promotion: PromotionDTO): string {
    if (promotion.benefits.length === 0) return "Sin beneficios"
    return promotion.benefits
        .map((b) => {
            if (b.discountType === "PERCENTAGE") return `${b.value}%`
            return `$${b.value}`
        })
        .join(", ")
}

export default function PromotionsClient({ promotions, products, total, page }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPromotion, setSelectedPromotion] = useState<PromotionDTO | null>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")
    const [toggleStatuses, setToggleStatuses] = useState<Record<number, boolean>>(() =>
        Object.fromEntries(promotions.map((p) => [p.id, p.active]))
    )
    const [isToggling, startToggleTransition] = useTransition()

    const currentStatus = searchParams.get("status") ?? ""

    const openCreate = () => {
        setSelectedPromotion(null)
        setMode("create")
        setIsModalOpen(true)
    }

    const openEdit = (promotion: PromotionDTO) => {
        setSelectedPromotion(promotion)
        setMode("edit")
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que querés eliminar esta promoción?")) {
            return
        }
        await deletePromotionAction(id)
    }

    const handleToggle = async (promotion: PromotionDTO) => {
        const next = !toggleStatuses[promotion.id]
        setToggleStatuses((prev) => ({ ...prev, [promotion.id]: next }))
        startToggleTransition(async () => {
            const result = await togglePromotionAction(promotion.id)
            if (!result.success) {
                // Revert on failure
                setToggleStatuses((prev) => ({ ...prev, [promotion.id]: promotion.active }))
            }
        })
    }

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        // Reset page when changing filters
        if (key !== "page") {
            params.delete("page")
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <>
            <PromotionModal
                products={products}
                promotion={selectedPromotion ?? undefined}
                isOpen={isModalOpen}
                mode={mode}
                onClose={() => setIsModalOpen(false)}
                action={mode === "edit" ? (fd) => updatePromotionAction(selectedPromotion!.id, fd) : createPromotionAction}
            />

            <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Promociones</h1>
                        <p className="text-sm text-slate-300 mt-1">
                            Gestioná cupones de descuento y promociones automáticas
                        </p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="h-4 w-4" />
                        Crear promoción
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                    <div className="p-6 pb-0">
                        <nav className="flex gap-1 border-b border-purple-400/20 overflow-x-auto">
                            {STATUS_TABS.map((tab) => {
                                const active = currentStatus === tab.value
                                return (
                                    <button
                                        key={tab.value}
                                        onClick={() => updateFilter("status", tab.value)}
                                        className={`flex items-center whitespace-nowrap px-4 pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                                            active
                                                ? "text-white border-purple-400"
                                                : "text-slate-300 border-transparent hover:text-slate-300"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="p-6">
                        {promotions.length === 0 ? (
                            currentStatus ? (
                                <EmptyState
                                    icon={Ticket}
                                    title="No se encontraron promociones"
                                    description="No hay promociones que coincidan con el filtro seleccionado"
                                    action={{ label: "Ver todas", onClick: () => updateFilter("status", "") }}
                                />
                            ) : (
                                <EmptyState
                                    icon={Ticket}
                                    title="No hay promociones todavía"
                                    description="Cuando crees promociones, aparecerán aquí con todos los detalles"
                                    action={{ label: "Crear promoción", onClick: openCreate }}
                                />
                            )
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-purple-400/20">
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Código</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Nombre</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Tipo</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Vigencia</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Descuento</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Estado</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Activa</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-purple-400/10">
                                            {promotions.map((p) => (
                                                <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono font-medium text-white">
                                                            {p.couponCode ?? "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-white">{p.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-slate-300">
                                                            {p.type === "COUPON" ? "Cupón" : "Automática"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-slate-300">
                                                            <div>{formatDate(p.startsAt)}</div>
                                                            <div>{formatDate(p.endsAt)}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-purple-300">
                                                            {benefitSummary(p)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {statusBadge(p.status)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => handleToggle(p)}
                                                            aria-label="Cambiar estado activo"
                                                            disabled={isToggling}
                                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                                                                toggleStatuses[p.id]
                                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                                    : "bg-red-500/20 text-red-400"
                                                            }`}
                                                        >
                                                            {toggleStatuses[p.id] ? "Activa" : "Inactiva"}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                                                                Editar
                                                            </Button>
                                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                                                                Eliminar
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="lg:hidden divide-y divide-purple-400/10">
                                    {promotions.map((p) => (
                                        <div key={p.id} className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                                    <p className="text-xs font-mono text-slate-300">
                                                        {p.couponCode ?? "Automática"}
                                                    </p>
                                                </div>
                                                {statusBadge(p.status)}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-slate-300">Tipo</p>
                                                    <p className="text-sm text-white">
                                                        {p.type === "COUPON" ? "Cupón" : "Automática"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-300">Descuento</p>
                                                    <p className="text-sm font-medium text-purple-300">
                                                        {benefitSummary(p)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-300">Inicio</p>
                                                    <p className="text-sm text-white">{formatDate(p.startsAt)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-300">Fin</p>
                                                    <p className="text-sm text-white">{formatDate(p.endsAt)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => handleToggle(p)}
                                                    aria-label="Cambiar estado activo"
                                                    disabled={isToggling}
                                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                                                        toggleStatuses[p.id]
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-red-500/20 text-red-400"
                                                    }`}
                                                >
                                                    {toggleStatuses[p.id] ? "Activa" : "Inactiva"}
                                                </button>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                                                        Editar
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {total > promotions.length && (
                                    <PaginationControls
                                        page={page}
                                        total={total}
                                        pageSize={promotions.length}
                                        basePath={pathname}
                                        currentParams={searchParams.toString()}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

function PaginationControls({
    page,
    total,
    pageSize,
    basePath,
    currentParams,
}: {
    page: number
    total: number
    pageSize: number
    basePath: string
    currentParams: string
}) {
    const totalPages = Math.ceil(total / pageSize)
    const params = new URLSearchParams(currentParams)

    return (
        <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-purple-400/10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const pageParams = new URLSearchParams(params.toString())
                pageParams.set("page", p.toString())
                return (
                    <a
                        key={p}
                        href={`${basePath}?${pageParams.toString()}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            p === page
                                ? "bg-purple-600 text-white"
                                : "bg-neutral-800 text-slate-300 hover:bg-neutral-700"
                        }`}
                    >
                        {p}
                    </a>
                )
            })}
        </div>
    )
}
