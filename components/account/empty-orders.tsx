import Link from "next/link"
import { ShoppingBag } from "lucide-react"

export function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
          <ShoppingBag className="w-9 h-9 text-purple-300/60" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-xl font-primary text-white font-medium mb-2">
        Aun no tenes pedidos
      </h3>
      <p className="text-sm text-white/40 font-secondary text-center max-w-sm mb-8 leading-relaxed">
        Explora nuestro catalogo y encontra lo que estas buscando. Tu proximo pedido te espera.
      </p>

      <Link
        href="/shop"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-purple-900 font-secondary font-medium text-sm transition-all hover:bg-purple-100 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-0.5"
      >
        Ir a la tienda
      </Link>
    </div>
  )
}
