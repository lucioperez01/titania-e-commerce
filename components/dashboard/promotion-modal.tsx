'use client'

import { useState, useTransition, useEffect } from "react"
import { PromotionDTO, PromotionConditionDTO, PromotionBenefitDTO } from "@/Interfaces/dto/promotion.dto"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { ActionResult } from "@/app/(dashboard)/actions"
import { Plus, X } from "lucide-react"

type PromotionModalMode = "create" | "edit"

type Props = {
    products: ProductDTO[]
    promotion?: PromotionDTO
    isOpen: boolean
    mode?: PromotionModalMode
    onClose: () => void
    action: (formData: FormData) => Promise<ActionResult<PromotionDTO>>
}

type ConditionForm = {
    minQuantity: string
    minSubtotal: string
    productId: string
    variantId: string
}

type BenefitForm = {
    discountType: "PERCENTAGE" | "FIXED"
    value: string
    applyToProductId: string
    applyToVariantId: string
}

const emptyCondition = (): ConditionForm => ({
    minQuantity: "",
    minSubtotal: "",
    productId: "",
    variantId: "",
})

const emptyBenefit = (): BenefitForm => ({
    discountType: "PERCENTAGE",
    value: "",
    applyToProductId: "",
    applyToVariantId: "",
})

export default function PromotionModal({ products, promotion, isOpen, mode = "create", onClose, action }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [conditions, setConditions] = useState<ConditionForm[]>([])
    const [benefits, setBenefits] = useState<BenefitForm[]>([])
    const [type, setType] = useState<"COUPON" | "AUTOMATIC">("COUPON")

    useEffect(() => {
        if (isOpen) {
            setError(null)
            if (mode === "edit" && promotion) {
                setType(promotion.type)
                setConditions(
                    promotion.conditions.map((c) => ({
                        minQuantity: c.minQuantity?.toString() ?? "",
                        minSubtotal: c.minSubtotal?.toString() ?? "",
                        productId: c.productId?.toString() ?? "",
                        variantId: c.variantId?.toString() ?? "",
                    }))
                )
                setBenefits(
                    promotion.benefits.map((b) => ({
                        discountType: b.discountType as "PERCENTAGE" | "FIXED",
                        value: b.value.toString(),
                        applyToProductId: b.applyToProductId?.toString() ?? "",
                        applyToVariantId: b.applyToVariantId?.toString() ?? "",
                    }))
                )
            } else {
                setType("COUPON")
                setConditions([emptyCondition()])
                setBenefits([emptyBenefit()])
            }
        }
    }, [isOpen, promotion, mode])

    if (!isOpen) return null

    const title = mode === "edit" ? "Editar promoción" : "Crear promoción"
    const submitLabel = mode === "edit" ? "Guardar" : "Crear"

    const addCondition = () => setConditions([...conditions, emptyCondition()])
    const removeCondition = (index: number) => {
        if (conditions.length <= 1) return
        setConditions(conditions.filter((_, i) => i !== index))
    }
    const updateCondition = (index: number, field: keyof ConditionForm, value: string) => {
        setConditions(conditions.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
    }

    const addBenefit = () => setBenefits([...benefits, emptyBenefit()])
    const removeBenefit = (index: number) => {
        if (benefits.length <= 1) return
        setBenefits(benefits.filter((_, i) => i !== index))
    }
    const updateBenefit = (index: number, field: keyof BenefitForm, value: string) => {
        setBenefits(benefits.map((b, i) => (i === index ? { ...b, [field]: value } : b)))
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        // Client-side validation
        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        if (!name || name.trim().length < 3) {
            setError("El nombre debe tener al menos 3 caracteres.")
            return
        }

        if (type === "COUPON") {
            const couponCode = formData.get("couponCode") as string
            if (!couponCode || !couponCode.trim()) {
                setError("El código de cupón es obligatorio para promociones tipo COUPON.")
                return
            }
        }

        const startsAt = formData.get("startsAt") as string
        const endsAt = formData.get("endsAt") as string
        if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
            setError("La fecha de fin debe ser posterior a la fecha de inicio.")
            return
        }

        if (benefits.length === 0) {
            setError("Al menos un beneficio de descuento es obligatorio.")
            return
        }

        for (let i = 0; i < benefits.length; i++) {
            const b = benefits[i]
            if (!b.value || Number(b.value) <= 0) {
                setError(`El valor del beneficio #${i + 1} debe ser mayor a 0.`)
                return
            }
        }

        // Serialize conditions and benefits as JSON
        const cleanConditions = conditions
            .filter((c) => c.minQuantity || c.minSubtotal || c.productId)
            .map((c) => ({
                minQuantity: c.minQuantity ? Number(c.minQuantity) : null,
                minSubtotal: c.minSubtotal ? Number(c.minSubtotal) : null,
                productId: c.productId ? Number(c.productId) : null,
                variantId: c.variantId ? Number(c.variantId) : null,
            }))

        const cleanBenefits = benefits.map((b) => ({
            discountType: b.discountType,
            value: Number(b.value),
            applyToProductId: b.applyToProductId ? Number(b.applyToProductId) : null,
            applyToVariantId: b.applyToVariantId ? Number(b.applyToVariantId) : null,
        }))

        formData.set("conditions", JSON.stringify(cleanConditions))
        formData.set("benefits", JSON.stringify(cleanBenefits))

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
            <div className="bg-white p-6 rounded-md shadow-lg w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl text-center font-bold font-secondary mb-4 text-neutral-900">{title}</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {mode === "edit" && promotion && (
                        <input type="hidden" name="id" value={promotion.id} />
                    )}

                    {/* Basic Info Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-neutral-700 mb-3 border-b border-gray-200 pb-2">
                            Información básica
                        </h3>

                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium mb-2 text-neutral-900">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                defaultValue={promotion?.name}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="type" className="block text-sm font-medium mb-2 text-neutral-900">
                                Tipo *
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={type}
                                onChange={(e) => setType(e.target.value as "COUPON" | "AUTOMATIC")}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                            >
                                <option value="COUPON">Cupón</option>
                                <option value="AUTOMATIC">Automática</option>
                            </select>
                        </div>

                        {type === "COUPON" && (
                            <div className="mb-4">
                                <label htmlFor="couponCode" className="block text-sm font-medium mb-2 text-neutral-900">
                                    Código de cupón *
                                </label>
                                <input
                                    type="text"
                                    id="couponCode"
                                    name="couponCode"
                                    defaultValue={promotion?.couponCode ?? ""}
                                    placeholder="Ej: DESCUENTO20"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900 uppercase"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="startsAt" className="block text-sm font-medium mb-2 text-neutral-900">
                                    Fecha de inicio
                                </label>
                                <input
                                    type="datetime-local"
                                    id="startsAt"
                                    name="startsAt"
                                    defaultValue={promotion?.startsAt ? promotion.startsAt.slice(0, 16) : ""}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                                />
                            </div>
                            <div>
                                <label htmlFor="endsAt" className="block text-sm font-medium mb-2 text-neutral-900">
                                    Fecha de fin
                                </label>
                                <input
                                    type="datetime-local"
                                    id="endsAt"
                                    name="endsAt"
                                    defaultValue={promotion?.endsAt ? promotion.endsAt.slice(0, 16) : ""}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-neutral-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conditions Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                            <h3 className="text-sm font-semibold text-neutral-700">Condiciones (opcional)</h3>
                            <button
                                type="button"
                                onClick={addCondition}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                                <Plus className="h-3 w-3" />
                                Agregar
                            </button>
                        </div>

                        {conditions.map((condition, index) => (
                            <div key={index} className="mb-3 p-3 bg-gray-50 rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-neutral-600">Condición #{index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeCondition(index)}
                                        disabled={conditions.length === 1}
                                        className="text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-neutral-700">
                                            Cantidad mínima
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={condition.minQuantity}
                                            onChange={(e) => updateCondition(index, "minQuantity", e.target.value)}
                                            placeholder="0"
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-neutral-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-neutral-700">
                                            Subtotal mínimo ($)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={condition.minSubtotal}
                                            onChange={(e) => updateCondition(index, "minSubtotal", e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-neutral-900"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium mb-1 text-neutral-700">
                                            Producto específico
                                        </label>
                                        <select
                                            value={condition.productId}
                                            onChange={(e) => updateCondition(index, "productId", e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-neutral-900"
                                        >
                                            <option value="">Cualquiera</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Benefits Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                            <h3 className="text-sm font-semibold text-neutral-700">Beneficios *</h3>
                            <button
                                type="button"
                                onClick={addBenefit}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                                <Plus className="h-3 w-3" />
                                Agregar
                            </button>
                        </div>

                        {benefits.map((benefit, index) => (
                            <div key={index} className="mb-3 p-3 bg-gray-50 rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-neutral-600">Beneficio #{index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeBenefit(index)}
                                        disabled={benefits.length === 1}
                                        className="text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-neutral-700">
                                            Tipo de descuento *
                                        </label>
                                        <select
                                            value={benefit.discountType}
                                            onChange={(e) =>
                                                updateBenefit(index, "discountType", e.target.value)
                                            }
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-neutral-900"
                                        >
                                            <option value="PERCENTAGE">Porcentaje (%)</option>
                                            <option value="FIXED">Monto fijo ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-neutral-700">
                                            Valor *
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={benefit.discountType === "FIXED" ? 0.01 : 1}
                                            max={benefit.discountType === "PERCENTAGE" ? 100 : undefined}
                                            value={benefit.value}
                                            onChange={(e) => updateBenefit(index, "value", e.target.value)}
                                            placeholder={benefit.discountType === "PERCENTAGE" ? "20" : "500.00"}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-neutral-900"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium mb-1 text-neutral-700">
                                            Aplicar a producto
                                        </label>
                                        <select
                                            value={benefit.applyToProductId}
                                            onChange={(e) =>
                                                updateBenefit(index, "applyToProductId", e.target.value)
                                            }
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-neutral-900"
                                        >
                                            <option value="">Todo el carrito</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-gray-200">
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
