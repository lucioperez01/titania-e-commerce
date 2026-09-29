'use client'

import { useState } from "react"
import ProductModal from "@/components/dashboard/product-modal"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { Button } from "@/components/ui/button"
import { createProductAction, deleteProductAction, updateProductAction, toggleProductOnlineAction } from "@/app/(dashboard)/actions"
import { Package, Plus } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function ProductsClient({ categories, products }: { categories: CategoryDTO[], products: ProductDTO[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")
    const [onlineStatuses, setOnlineStatuses] = useState<Record<number, boolean>>(() =>
        Object.fromEntries(products.map((p) => [p.id, p.isOnline]))
    )

    const openCreate = () => {
        setSelectedProduct(null)
        setMode("create")
        setIsModalOpen(true)
    }

    const openEdit = (product: ProductDTO) => {
        setSelectedProduct(product)
        setMode("edit")
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que querés eliminar este producto?")) {
            return
        }
        await deleteProductAction(id)
    }

    const handleToggleOnline = async (product: ProductDTO) => {
        const next = !onlineStatuses[product.id]
        setOnlineStatuses((prev) => ({ ...prev, [product.id]: next }))
        await toggleProductOnlineAction(product.id, next)
    }

    return (
        <>
            <ProductModal
                categories={categories}
                product={selectedProduct ?? undefined}
                isOpen={isModalOpen}
                mode={mode}
                onClose={() => setIsModalOpen(false)}
                action={mode === "edit" ? updateProductAction : createProductAction}
            />

            <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Productos</h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Aquí puedes ver y gestionar tus productos
                        </p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="h-4 w-4" />
                        Agregar producto
                    </Button>
                </div>

                {products.length === 0 ? (
                    <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                        <EmptyState
                            icon={Package}
                            title="No hay productos todavía"
                            description="Cuando agregues productos, aparecerán aquí con todos los detalles"
                            action={{ label: "Agregar producto", onClick: openCreate }}
                        />
                    </div>
                ) : (
                    <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl overflow-hidden">
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-purple-400/20">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Online</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-400/10">
                                    {products.map((p) => (
                                        <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {p.images && p.images.length > 0 ? (
                                                        <img
                                                            src={p.images[0].url}
                                                            alt={p.name}
                                                            className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                                                            <Package className="h-5 w-5 text-slate-500" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium text-white">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300">{formatCurrency(p.price)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-300">{p.stock}</td>
                                            <td className="px-6 py-4 text-sm text-slate-300">{p.category.name}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleOnline(p)}
                                                    aria-label="cambiar estado"
                                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                                                        onlineStatuses[p.id]
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-red-500/20 text-red-400"
                                                    }`}
                                                >
                                                    {onlineStatuses[p.id] ? "Online" : "Offline"}
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

                        <div className="lg:hidden divide-y divide-purple-400/10">
                            {products.map((p) => (
                                <div key={p.id} className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        {p.images && p.images.length > 0 ? (
                                            <img
                                                src={p.images[0].url}
                                                alt={p.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center">
                                                <Package className="h-5 w-5 text-slate-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                            <p className="text-xs text-slate-400">{p.category.name}</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleOnline(p)}
                                            aria-label="cambiar estado"
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                onlineStatuses[p.id]
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}
                                        >
                                            {onlineStatuses[p.id] ? "Online" : "Offline"}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-slate-400">Precio</p>
                                            <p className="text-sm font-medium text-white">{formatCurrency(p.price)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Stock</p>
                                            <p className="text-sm font-medium text-white">{p.stock}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                                            Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(p.id)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-xs text-slate-500">*Los productos que estén en estado "Offline" no serán visibles para los clientes.</p>
            </div>
        </>
    )
}
