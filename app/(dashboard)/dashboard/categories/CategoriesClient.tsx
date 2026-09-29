'use client'

import { useState } from "react"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { Button } from "@/components/ui/button"
import CategoryModal from "@/components/dashboard/category-modal"
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/(dashboard)/actions"
import { FolderOpen, Plus } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"

export default function CategoriesClient({ categories }: { categories: CategoryDTO[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")

    const openCreate = () => {
        setSelectedCategory(null)
        setMode("create")
        setIsModalOpen(true)
    }

    const openEdit = (category: CategoryDTO) => {
        setSelectedCategory(category)
        setMode("edit")
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que querés eliminar esta categoría?")) {
            return
        }
        await deleteCategoryAction(id)
    }

    return (
        <>
            <CategoryModal
                category={selectedCategory ?? undefined}
                isOpen={isModalOpen}
                mode={mode}
                onClose={() => setIsModalOpen(false)}
                action={mode === "edit" ? updateCategoryAction : createCategoryAction}
            />

            <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Categorías</h1>
                        <p className="text-sm text-slate-300 mt-1">
                            Aquí puedes ver y gestionar tus categorías
                        </p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="h-4 w-4" />
                        Agregar categoría
                    </Button>
                </div>

                {categories.length === 0 ? (
                    <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                        <EmptyState
                            icon={FolderOpen}
                            title="No hay categorías todavía"
                            description="Cuando agregues categorías, aparecerán aquí"
                            action={{ label: "Agregar categoría", onClick: openCreate }}
                        />
                    </div>
                ) : (
                    <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl overflow-hidden">
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-purple-400/20">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Slug</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Navbar</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-400/10">
                                    {categories.map((c) => (
                                        <tr key={c.id} className={`hover:bg-neutral-800/40 transition-colors ${c.isDeleted ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-4 text-sm font-medium text-white">{c.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-300">{c.slug}</td>
                                            <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate" title={c.description ?? ""}>
                                                {c.description || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {c.showInNavbar ? (
                                                    <span className="text-sm text-emerald-400">Sí</span>
                                                ) : (
                                                    <span className="text-sm text-slate-300">No</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {c.isDeleted ? (
                                                    <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400">
                                                        Eliminada
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
                                                        Activa
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                                                        Editar
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}>
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
                            {categories.map((c) => (
                                <div key={c.id} className={`p-4 space-y-3 ${c.isDeleted ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-white">{c.name}</p>
                                        {c.isDeleted ? (
                                            <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400">
                                                Eliminada
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
                                                Activa
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-slate-300">Slug</p>
                                            <p className="text-sm font-mono text-slate-300">{c.slug}</p>
                                        </div>
                                        {c.description && (
                                            <div>
                                                <p className="text-xs text-slate-300">Descripción</p>
                                                <p className="text-sm text-slate-300 line-clamp-2">{c.description}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-slate-300">Navbar</p>
                                            <p className={`text-sm font-medium ${c.showInNavbar ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                {c.showInNavbar ? 'Sí' : 'No'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(c)}>
                                            Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(c.id)} disabled={c.isDeleted}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
