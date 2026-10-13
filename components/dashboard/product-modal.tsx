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

const PREDEFINED_SIZES = new Set([
    "XS", "S", "M", "L", "XL", "XXL",
    "36", "38", "40", "42", "44", "46",
    "35", "37", "39",
])

function resolveInitialSize(product?: ProductDTO): { selectValue: string; customSize: string } {
    if (!product?.size) return { selectValue: "", customSize: "" }
    if (PREDEFINED_SIZES.has(product.size)) return { selectValue: product.size, customSize: "" }
    return { selectValue: "__other__", customSize: product.size }
}

export default function ProductModal({ categories, product, isOpen, mode = "create", onClose, action }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [sizeSelectValue, setSizeSelectValue] = useState("")
    const [customSize, setCustomSize] = useState("")

    useEffect(() => {
        setImageUrls(
            product?.images?.map((image) => image.url) ?? [""]
        )
        const initial = resolveInitialSize(product)
        setSizeSelectValue(initial.selectValue)
        setCustomSize(initial.customSize)
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

        // Resolve size value from select + custom input
        let resolvedSize = ""
        if (sizeSelectValue === "__other__") {
            resolvedSize = customSize.trim()
        } else if (sizeSelectValue) {
            resolvedSize = sizeSelectValue
        }

        if (resolvedSize.length > 50) {
            setError("El talle debe tener 50 caracteres o menos.")
            return
        }

        const formData = new FormData(e.currentTarget)
        // Set the resolved size value (overrides any hidden input)
        formData.set("size", resolvedSize)

        // Client-side validation for width/length
        const widthVal = formData.get("width")
        const lengthVal = formData.get("length")
        if (widthVal !== null && String(widthVal).trim() !== "") {
            const w = Number(widthVal)
            if (!Number.isNaN(w) && w < 0) {
                setError("El ancho no puede ser negativo.")
                return
            }
        }
        if (lengthVal !== null && String(lengthVal).trim() !== "") {
            const l = Number(lengthVal)
            if (!Number.isNaN(l) && l < 0) {
                setError("El largo no puede ser negativo.")
                return
            }
        }

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
                    {/* ── Measurements section ── */}
                    <div className="mb-4 border-t border-gray-200 pt-4">
                        <p className="text-sm font-semibold text-neutral-700 mb-3">Medidas (opcional)</p>

                        <div className="mb-4">
                            <label htmlFor="size-select" className="block text-sm font-medium mb-2 text-neutral-900">Talle</label>
                            <select
                                id="size-select"
                                value={sizeSelectValue}
                                onChange={(e) => {
                                    setSizeSelectValue(e.target.value)
                                    if (e.target.value !== "__other__") {
                                        setCustomSize("")
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                            >
                                <option value="">Sin talle</option>
                                <optgroup label="Alfabético">
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                </optgroup>
                                <optgroup label="Jeans">
                                    <option value="36">36</option>
                                    <option value="38">38</option>
                                    <option value="40">40</option>
                                    <option value="42">42</option>
                                    <option value="44">44</option>
                                    <option value="46">46</option>
                                </optgroup>
                                <optgroup label="Calzado">
                                    <option value="35">35</option>
                                    <option value="36">36</option>
                                    <option value="37">37</option>
                                    <option value="38">38</option>
                                    <option value="39">39</option>
                                    <option value="40">40</option>
                                </optgroup>
                                <option value="__other__">Otro...</option>
                            </select>
                            {sizeSelectValue === "__other__" && (
                                <input
                                    type="text"
                                    value={customSize}
                                    onChange={(e) => setCustomSize(e.target.value)}
                                    maxLength={50}
                                    placeholder="Ingresar talle personalizado"
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="width" className="block text-sm font-medium mb-2 text-neutral-900">Ancho (cm)</label>
                                <input
                                    type="number"
                                    id="width"
                                    name="width"
                                    min={0}
                                    step={0.1}
                                    defaultValue={product?.width ?? ""}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                                />
                            </div>
                            <div>
                                <label htmlFor="length" className="block text-sm font-medium mb-2 text-neutral-900">Largo (cm)</label>
                                <input
                                    type="number"
                                    id="length"
                                    name="length"
                                    min={0}
                                    step={0.1}
                                    defaultValue={product?.length ?? ""}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                                />
                            </div>
                        </div>
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