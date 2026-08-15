'use client'

import { useState, useTransition } from "react"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { ActionResult } from "@/app/(dashboard)/actions"

type CategoryModalMode = "create" | "edit"

type Props = {
    category?: CategoryDTO;
    isOpen: boolean;
    mode?: CategoryModalMode;
    onClose: () => void;
    action: (formData: FormData) => Promise<ActionResult>;
}

export default function CategoryModal({ category, isOpen, mode = "create", onClose, action }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [descLength, setDescLength] = useState(category?.description?.length ?? 0)
    const [isPending, startTransition] = useTransition()

    if (!isOpen) return null

    const title = mode === "edit" ? "Editar categoría" : "Crear categoría"
    const submitLabel = mode === "edit" ? "Guardar" : "Crear"

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setError(null)
        startTransition(async () => {
            const result = await action(formData)
            if (!result.success) {
                setError(result.error ?? "Error desconocido.")
            } else {
                onClose()
            }
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-md shadow-lg w-md">
                <h2 className="text-2xl text-center font-bold font-secondary mb-4 text-neutral-900">{title}</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {mode === "edit" && category && (
                        <input type="hidden" name="id" value={category.id} />
                    )}
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium mb-2 text-neutral-900">Nombre</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={category?.name}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="image" className="block text-sm font-medium mb-2 text-neutral-900">URL de imagen *</label>
                        <input
                            type="text"
                            id="image"
                            name="image"
                            defaultValue={category?.image}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium mb-2 text-neutral-900">
                            Descripción <span className="text-neutral-500 font-normal">(opcional, máx. 300 caracteres)</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            defaultValue={category?.description}
                            maxLength={300}
                            rows={3}
                            onChange={(e) => setDescLength(e.target.value.length)}
                            placeholder="Descripción corta de la categoría..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900 resize-none"
                        />
                        <p className="text-xs text-neutral-500 mt-1 text-right">{descLength}/300</p>
                    </div>
                    <div className="mb-4 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="showInNavbar"
                            name="showInNavbar"
                            defaultChecked={category?.showInNavbar}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor="showInNavbar" className="text-sm font-medium text-neutral-900">
                            Mostrar en navbar (máx. 5 categorías)
                        </label>
                    </div>
                    <div className="flex justify-between">
                        <button
                            type="button"
                            className="mr-2 px-4 py-2 font-primary font-bold text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 font-primary font-bold bg-blue-500 text-white rounded-md cursor-pointer disabled:opacity-50"
                        >
                            {isPending ? "Guardando..." : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}