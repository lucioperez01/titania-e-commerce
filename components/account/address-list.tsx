"use client"

import { useState, useTransition } from "react"
import { MapPin, Plus, Trash2, Edit, Check, X } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import type { AddressData } from "@/app/(store)/account/profile/actions"
import { deleteAddress, setDefaultAddress } from "@/app/(store)/account/profile/actions"
import { AddressForm } from "./address-form"

export function AddressList({ addresses }: { addresses: AddressData[] }) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteAddress(id)
      if (result.success) {
        showToast("Direccion eliminada")
        setDeletingId(null)
      } else {
        showToast(result.error ?? "Error al eliminar la direccion")
      }
    })
  }

  const handleSetDefault = (id: number) => {
    startTransition(async () => {
      const result = await setDefaultAddress(id)
      if (result.success) {
        showToast("Direccion predeterminada actualizada")
      } else {
        showToast(result.error ?? "Error al actualizar")
      }
    })
  }

  return (
    <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-primary text-white font-medium">
          Direcciones de envio
        </h2>
        {!showForm && !editingAddress && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.12] text-purple-300 font-secondary text-sm transition-all duration-300 hover:bg-white/[0.14] hover:text-white hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        )}
      </div>

      {/* Inline form for new/edit */}
      {(showForm || editingAddress) && (
        <AddressForm
          initialData={editingAddress}
          onClose={() => {
            setShowForm(false)
            setEditingAddress(null)
          }}
          onSaved={() => {
            setShowForm(false)
            setEditingAddress(null)
          }}
        />
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm && !editingAddress ? (
        <div className="text-center py-8">
          <MapPin className="w-8 h-8 text-white/20 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-white/40 font-secondary">
            No tienes direcciones guardadas
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-purple-300/80 hover:text-white font-secondary transition-colors"
          >
            Agregar tu primera direccion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="group relative bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.12]"
            >
              {/* Default badge */}
              {addr.isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-secondary font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  <Check className="w-2.5 h-2.5" />
                  Predeterminada
                </span>
              )}

              <div className="pr-24 sm:pr-28">
                <p className="text-sm font-primary text-white font-medium mb-1">
                  {addr.fullName}
                </p>
                <p className="text-xs text-white/40 font-secondary mb-1">
                  {addr.phone}
                </p>
                <p className="text-sm text-white/60 font-secondary">
                  {addr.line1}
                  {addr.line2 && `, ${addr.line2}`}
                </p>
                <p className="text-sm text-white/50 font-secondary">
                  {addr.city}, {addr.province} {addr.postalCode}
                </p>
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                {addr.isDefault && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-secondary font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
                    <Check className="w-2.5 h-2.5" />
                    Predeterminada
                  </span>
                )}
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={isPending}
                    className="px-2 py-1 rounded-lg text-[10px] font-secondary text-white/40 hover:text-white/80 hover:bg-white/[0.10] transition-all cursor-pointer disabled:opacity-40"
                    title="Marcar como predeterminada"
                  >
                    Predeterminar
                  </button>
                )}
                <button
                  onClick={() => setEditingAddress(addr)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.10] transition-all cursor-pointer"
                  title="Editar direccion"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                {deletingId === addr.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-all cursor-pointer disabled:opacity-40"
                      title="Confirmar eliminacion"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.10] transition-all cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(addr.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    title="Eliminar direccion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
