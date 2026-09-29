'use client'

import { useState } from "react"
import { Award, AlertTriangle, Package } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"

interface ProductPerformance {
    productId: number
    productName: string
    quantity: number
    revenue: number
}

interface PerformanceTabsProps {
    bestSellers: ProductPerformance[]
    worstSellers: ProductPerformance[]
}

export function PerformanceTabs({ bestSellers, worstSellers }: PerformanceTabsProps) {
    const [activeTab, setActiveTab] = useState<"top" | "worst">("top")

    const items = activeTab === "top" ? bestSellers : worstSellers
    const maxQuantity = items.length > 0 ? Math.max(...items.map((p) => p.quantity)) : 1

    return (
        <div>
            <div className="flex border-b border-purple-400/20">
                <button
                    onClick={() => setActiveTab("top")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "top"
                            ? "text-white border-purple-400"
                            : "text-slate-300 border-transparent hover:text-slate-300"
                    }`}
                >
                    <Award className="h-4 w-4" />
                    Top Products
                </button>
                <button
                    onClick={() => setActiveTab("worst")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "worst"
                            ? "text-white border-purple-400"
                            : "text-slate-300 border-transparent hover:text-slate-300"
                    }`}
                >
                    <AlertTriangle className="h-4 w-4" />
                    Worst Sellers
                </button>
            </div>

            <div className="p-6">
                {items.length === 0 ? (
                    <EmptyState
                        icon={activeTab === "top" ? Award : AlertTriangle}
                        title={activeTab === "top" ? "Sin ventas todavía" : "Sin datos todavía"}
                        description={
                            activeTab === "top"
                                ? "Tus productos más vendidos aparecerán aquí"
                                : "Los productos con menos ventas se mostrarán aquí"
                        }
                        variant="compact"
                    />
                ) : (
                    <ul className="space-y-4">
                        {items.map((product, i) => (
                            <li key={product.productId} className="group">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                i < 3
                                                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                                                    : "bg-neutral-800 text-slate-300"
                                            }`}
                                        >
                                            {i + 1}
                                        </span>
                                        <Package className="h-4 w-4 text-slate-300" />
                                        <span className="text-sm font-medium text-white">
                                            {product.productName}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-white">
                                            {product.quantity} ventas
                                        </span>
                                        <p className="text-xs text-slate-300">
                                            ${product.revenue.toLocaleString("es-AR")}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            activeTab === "top"
                                                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                                : "bg-gradient-to-r from-rose-500 to-orange-500"
                                        }`}
                                        style={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
