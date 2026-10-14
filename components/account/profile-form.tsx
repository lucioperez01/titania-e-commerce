"use client"

import { useState, useTransition } from "react"
import { Mail, Phone, User as UserIcon, Save } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import type { ProfileData } from "@/app/(store)/account/profile/actions"
import { updateProfile } from "@/app/(store)/account/profile/actions"

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [form, setForm] = useState({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    phone: profile.phone ?? "",
    mailing: profile.mailing,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        mailing: form.mailing,
      })

      if (result.success) {
        showToast("Perfil actualizado correctamente")
      } else {
        showToast(result.error ?? "Error al actualizar el perfil")
      }
    })
  }

  const isDirty =
    form.firstName !== (profile.firstName ?? "") ||
    form.lastName !== (profile.lastName ?? "") ||
    form.phone !== (profile.phone ?? "") ||
    form.mailing !== profile.mailing

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 mb-6 transition-all duration-300"
    >
      <h2 className="text-lg font-primary text-white font-medium mb-6">
        Datos personales
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* First name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 font-secondary">
            <UserIcon className="w-3.5 h-3.5" />
            Nombre
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            maxLength={100}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white font-secondary text-sm placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.08] transition-all duration-300"
            placeholder="Tu nombre"
          />
        </div>

        {/* Last name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 font-secondary">
            <UserIcon className="w-3.5 h-3.5" />
            Apellido
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            maxLength={100}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white font-secondary text-sm placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.08] transition-all duration-300"
            placeholder="Tu apellido"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 font-secondary">
            <Mail className="w-3.5 h-3.5" />
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/40 font-secondary text-sm cursor-not-allowed"
          />
          <p className="text-[11px] text-white/30 font-secondary">No se puede modificar</p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 font-secondary">
            <Phone className="w-3.5 h-3.5" />
            Telefono
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
            maxLength={15}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white font-secondary text-sm placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.08] transition-all duration-300"
            placeholder="1123456789"
          />
        </div>
      </div>

      {/* Marketing checkbox */}
      <div className="mt-6 flex items-start gap-3">
        <input
          type="checkbox"
          id="mailing"
          checked={form.mailing}
          onChange={(e) => handleChange("mailing", e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.06] text-purple-500 focus:ring-purple-400/30 focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="mailing" className="text-sm text-white/50 font-secondary cursor-pointer select-none">
          Quiero recibir novedades y ofertas exclusivas
        </label>
      </div>

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-secondary font-medium text-sm transition-all duration-300 hover:from-purple-400 hover:to-pink-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
        >
          <Save className="w-4 h-4" strokeWidth={1.5} />
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  )
}
