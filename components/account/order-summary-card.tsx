import { Package } from "lucide-react"

interface OrderSummaryCardProps {
  subtotal: number
  shippingCost: number
  total: number
}

export function OrderSummaryCard({ subtotal, shippingCost, total }: OrderSummaryCardProps) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.10] hover:border-white/[0.15]">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.08]">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Package className="w-4 h-4 text-purple-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-secondary text-white/60 uppercase tracking-wider">
          Resumen del Pedido
        </h3>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-white/60 font-secondary">Subtotal</span>
          <span className="text-white/90 font-medium">
            ${subtotal.toLocaleString("es-AR")}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white/60 font-secondary">Envío</span>
          <span className="text-white/90 font-medium">
            {shippingCost === 0 ? (
              <span className="text-emerald-400">Gratis</span>
            ) : (
              `$${shippingCost.toLocaleString("es-AR")}`
            )}
          </span>
        </div>

        <div className="pt-3 mt-3 border-t border-white/[0.08] flex justify-between items-center">
          <span className="text-white font-semibold text-base">Total</span>
          <span className="text-2xl font-primary text-white font-bold">
            ${total.toLocaleString("es-AR")}
          </span>
        </div>
      </div>
    </div>
  )
}
