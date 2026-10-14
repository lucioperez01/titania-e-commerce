"use client"

import { useState, useTransition } from "react"
import { X, MapPin, Save } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import type { AddressData } from "@/app/(store)/account/profile/actions"
import { addAddress, updateAddress } from "@/app/(store)/account/profile/actions"

type Props = {
  initialData: AddressData | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  province: "",
  postalCode: "",
  isDefault: false,
}

export function AddressForm({ initialData, onClose, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const isEditing = !!initialData

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        fullName: initialData.fullName,
        phone: initialData.phone,
        line1: initialData.line1,
        line2: initialData.line2 ?? "",
        city: initialData.city,
        province: initialData.province,
        postalCode: initialData.postalCode,
        isDefault: initialData.isDefault,
      }
    }
    return EMPTY_FORM
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.fullName.trim()) newErrors.fullName = "Requerido"
    else if (form.fullName.trim().length > 200) newErrors.fullName = "Maximo 200 caracteres"

    if (!form.phone.trim()) newErrors.phone = "Requerido"
    else if (!/^\d{10,15}$/.test(form.phone.trim())) newErrors.phone = "10-15 digitos"

    if (!form.line1.trim()) newErrors.line1 = "Requerido"
    else if (form.line1.trim().length > 300) newErrors.line1 = "Maximo 300 caracteres"

    if (!form.city.trim()) newErrors.city = "Requerido"
    else if (form.city.trim().length > 100) newErrors.city = "Maximo 100 caracteres"

    if (!form.province.trim()) newErrors.province = "Requerido"
    else if (form.province.trim().length > 100) newErrors.province = "Maximo 100 caracteres"

    if (!form.postalCode.trim()) newErrors.postalCode = "Requerido"
    else if (form.postalCode.trim().length > 20) newErrors.postalCode = "Maximo 20 caracteres"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      province: form.province.trim(),
      postalCode: form.postalCode.trim(),
      isDefault: form.isDefault,
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateAddress(initialData!.id, payload)
        : await addAddress(payload)

      if (result.success) {
        showToast(isEditing ? "Direccion actualizada" : "Direccion agregada")
        onSaved()
      } else {
        showToast(result.error ?? "Error al guardar la direccion")
      }
    })
  }

  const inputClass = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border text-white font-secondary text-sm placeholder-white/30 focus:outline-none focus:bg-white/[0.08] transition-all duration-300 ${
      errors[field]
        ? "border-red-400/50 focus:border-red-400/70"
        : "border-white/[0.08] focus:border-purple-400/50"
    }`

  return (
    <div className="mb-4 bg-white/[0.08] backdrop-blur-md border border-purple-500/20 rounded-xl p-5 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-primary text-white font-medium">
          <MapPin className="w-4 h-4 text-purple-300" />
          {isEditing ? "Editar direccion" : "Nueva direccion"}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.10] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full name */}
          <div className="space-y-1">
            <label className="text-xs text-white/40 font-secondary">Nombre completo</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              maxLength={200}
              className={inputClass("fullName")}
              placeholder="Ej: Maria Lopez"
            />
            {errors.fullName && <p className="text-[11px] text-red-400/80 font-secondary">{errors.fullName}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs text-white/40 font-secondary">Telefono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
              maxLength={15}
              className={inputClass("phone")}
              placeholder="1123456789"
            />
            {errors.phone && <p className="text-[11px] text-red-400/80 font-secondary">{errors.phone}</p>}
          </div>

          {/* Line 1 */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs text-white/40 font-secondary">Direccion</label>
            <input
              type="text"
              value={form.line1}
              onChange={(e) => handleChange("line1", e.target.value)}
              maxLength={300}
              className={inputClass("line1")}
              placeholder="Calle y numero"
            />
            {errors.line1 && <p className="text-[11px] text-red-400/80 font-secondary">{errors.line1}</p>}
          </div>

          {/* Line 2 (optional) */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs text-white/40 font-secondary">Piso / Depto / Timbre (opcional)</label>
            <input
              type="text"
              value={form.line2}
              onChange={(e) => handleChange("line2", e.target.value)}
              className={inputClass("line2")}
              placeholder="Opcional"
            />
          </div>

          {/* City */}
          <div className="space-y-1">
            <label className="text-xs text-white/40 font-secondary">Ciudad / Localidad</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              maxLength={100}
              className={inputClass("city")}
              placeholder="Ej: CABA"
            />
            {errors.city && <p className="text-[11px] text-red-400/80 font-secondary">{errors.city}</p>}
          </div>

          {/* Province */}
          <div className="space-y-1">
            <label className="text-xs text-white/40 font-secondary">Provincia</label>
            <input
              type="text"
              value={form.province}
              onChange={(e) => handleChange("province", e.target.value)}
              maxLength={100}
              className={inputClass("province")}
              placeholder="Ej: Buenos Aires"
            />
            {errors.province && <p className="text-[11px] text-red-400/80 font-secondary">{errors.province}</p>}
          </div>

          {/* Postal Code */}
          <div className="space-y-1">
            <label className="text-xs text-white/40 font-secondary">Codigo Postal</label>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              maxLength={20}
              className={inputClass("postalCode")}
              placeholder="Ej: 1414"
            />
            {errors.postalCode && <p className="text-[11px] text-red-400/80 font-secondary">{errors.postalCode}</p>}
          </div>
        </div>

        {/* Default checkbox */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="addressDefault"
            checked={form.isDefault}
            onChange={(e) => handleChange("isDefault", e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/[0.06] text-purple-500 focus:ring-purple-400/30 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="addressDefault" className="text-sm text-white/50 font-secondary cursor-pointer select-none">
            Marcar como direccion predeterminada
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white/50 font-secondary text-sm transition-all hover:text-white hover:bg-white/[0.08] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-secondary font-medium text-sm transition-all duration-300 hover:from-purple-400 hover:to-pink-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Guardar direccion"}
          </button>
        </div>
      </form>
    </div>
  )
}
