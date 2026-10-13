"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function OrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
            <AlertTriangle className="w-9 h-9 text-red-400/80" strokeWidth={1.5} />
          </div>
        </div>

        <h3 className="text-xl font-primary text-white font-medium mb-2">
          Error al cargar el pedido
        </h3>
        <p className="text-sm text-white/40 font-secondary text-center max-w-sm mb-8 leading-relaxed">
          No pudimos cargar los detalles de tu pedido. Intenta de nuevo.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white font-secondary font-medium text-sm transition-all hover:bg-white/[0.14] hover:-translate-y-0.5"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-900 font-secondary font-medium text-sm transition-all hover:bg-purple-100 hover:-translate-y-0.5"
          >
            Volver a mis pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}
