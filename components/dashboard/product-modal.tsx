'use client'

import { useState, useTransition } from "react"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { ActionResult } from "@/app/(dashboard)/actions"
import {useEffect} from "react";

type ProductModalMode = "create" | "edit"

type Props = {
    categories: CategoryDTO[];
    product?: ProductDTO;
    isOpen: boolean;
    mode?: ProductModalMode;
    onClose: () => void;
    action: (formData: FormData) => Promise<ActionResult>;
}

export default function ProductModal({ categories, product, isOpen, mode = "create", onClose, action }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [imageUrls, setImageUrls] = useState<string[]>([])

    useEffect(() => {
        setImageUrls(
            product?.images?.map((image) => image.url) ?? [""]
        )
    }, [product?.id])

    if (!isOpen) return null

    const title = mode === "edit" ? "Editar producto" : "Crear producto"
    const submitLabel = mode === "edit" ? "Guardar" : "Crear"

    const updateImageUrl = (index: number, value: string) => {
        setImageUrls((urls) => urls.map((url, i) => (i === index ? value : url)))
    }

    const addImageUrl = () => {
        setImageUrls((urls) => [...urls, ""])
    }

    const removeImageUrl = (index: number) => {
        setImageUrls((urls) => {
            if (urls.length <= 1) return urls
            return urls.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        if (imageUrls.filter(Boolean).length === 0) {
            setError("Al menos una imagen es obligatoria.")
            return
        }

        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await action(formData)

            if (!result.success) {
                if (result.error?.includes("Foreign key constraint failed")) {
                    setError("La categoría seleccionada no existe.")
                } else if (result.error?.includes("Invalid input")) {
                    setError("Datos inválidos.")
                    
                } else if (result.error?.includes("Unique constraint failed on the fields: (`slug`)")) {
                setError("El nombre del producto ya existe.")
                } else {
                setError(result.error ?? "Error desconocido.")
                }
            } else {
                onClose()
            }
        })
    }


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-md shadow-lg w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl text-center font-bold font-secondary mb-4 text-neutral-900">{title}</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {mode === "edit" && product && (
                        <input type="hidden" name="id" value={product.id} />
                    )}
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium mb-2 text-neutral-900">Nombre</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={product?.name}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="price" className="block text-sm font-medium mb-2 text-neutral-900">Precio</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            min={0}
                            defaultValue={product?.price}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="stock" className="block text-sm font-medium mb-2 text-neutral-900">Stock</label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            min={0}
                            defaultValue={product?.stock}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="categoryId" className="block text-sm font-medium mb-2 text-neutral-900">Categoría</label>
                        <select
                            id="categoryId"
                            name="categoryId"
                            defaultValue={product?.category?.id}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                        >
                            <option value="">Seleccionar categoría</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="brand" className="block text-sm font-medium mb-2 text-neutral-900">Marca</label>
                        <input
                            type="text"
                            id="brand"
                            name="brand"
                            defaultValue={product?.brand}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium mb-2 text-neutral-900">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            defaultValue={product?.desc}
                            className="w-full px-3 max-h-40 py-2 border border-gray-300 rounded-md text-neutral-900"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-neutral-900">URL de imagen *</label>
                        {imageUrls.map((url, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="url"
                                    name="image"
                                    value={url}
                                    onChange={(e) => updateImageUrl(index, e.target.value)}
                                    placeholder="https://..."
                                    aria-label="URL de imagen"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImageUrl(index)}
                                    disabled={imageUrls.length === 1}
                                    className="px-3 py-2 font-secondary font-bold text-red-600 border border-gray-300 rounded-md hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addImageUrl}
                            className="mt-2 px-4 py-2 font-secondary font-bold text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 cursor-pointer"
                        >
                            Agregar imagen
                        </button>
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