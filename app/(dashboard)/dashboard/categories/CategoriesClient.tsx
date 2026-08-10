'use client'

import { useState } from "react"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { Button } from "@/components/ui/button"
import CategoryModal from "@/components/dashboard/category-modal"
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/(dashboard)/actions"

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

            <main className="w-full flex items-center justify-center">
                <div className="mt-5 w-xl lg:w-4xl">
                    <h1 className="text-4xl font-bold text-white">Categorías</h1>
                    <p className="text-md text-slate-200">Aquí puedes ver y gestionar tus categorías.</p>

                    <div className="font-primary font-bold w-full max-w-4xl text-white mt-4 border border-white rounded-lg shadow-lg bg-neutral-800/30">
                        <table className="w-full text-white">
                            <thead className="w-full bg-linear-to-l from-purple-600/20 to-purple-600/30">
                                <tr className="text-md">
                                    <th className="text-center py-2">Nombre</th>
                                    <th className="text-center py-2">Slug</th>
                                    <th className="text-center py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="w-full text-white">
                                {categories.map((c) => (
                                    <tr key={c.id} className="w-full font-secondary bg-linear-to-r from-purple-600/30 to-purple-600/50 items-center justify-between hover:bg-purple-600/60 transition-colors group cursor-pointer">
                                        <td className="text-center px-3 py-2">{c.name}</td>
                                        <td className="text-center px-3 py-2">{c.slug}</td>
                                        <td className="text-center px-3 py-2">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="font-secondary font-extrabold text-slate-600 border-neutral-700/30 hover:cursor-pointer gap-2 h-6 w-13"
                                                    onClick={() => openEdit(c)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="font-secondary font-extrabold hover:cursor-pointer gap-2 h-6 w-13"
                                                    onClick={() => handleDelete(c.id)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {categories.length === 0 && (
                        <h2 className="text-center text-white mt-4">No hay categorías...</h2>
                    )}
                    <Button
                        onClick={openCreate}
                        variant="outline"
                        className="mt-4 w-full font-secondary font-extrabold border-neutral-700/80 hover:cursor-pointer h-10 w-full bg-purple-600/40 text-white transition-colors border-slate-200 border-1"
                    >
                        Agregar categoría
                    </Button>
                </div>
            </main>
        </>
    )
}
