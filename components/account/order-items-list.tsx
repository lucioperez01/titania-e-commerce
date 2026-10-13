"use client"

import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"

interface OrderItem {
  id: number
  quantity: number
  price: number
  product: {
    name: string
    slug: string
    price: number
    image: string | null
  }
}

interface OrderItemsListProps {
  items: OrderItem[]
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.10] hover:border-white/[0.15]">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.08]">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Package className="w-4 h-4 text-purple-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-secondary text-white/60 uppercase tracking-wider">
          Productos del Pedido
        </h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const lineTotal = item.price * item.quantity
          return (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all hover:bg-white/[0.06] hover:border-white/[0.10]"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-white/[0.04] flex-shrink-0">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, 80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-white/20" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="text-white font-medium text-sm sm:text-base hover:text-purple-300 transition-colors line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-white/50 font-secondary">
                    <span>Cantidad: {item.quantity}</span>
                    <span className="text-white/30">·</span>
                    <span>${item.price.toLocaleString("es-AR")} c/u</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs text-white/40 font-secondary">Total línea</span>
                  <span className="text-white font-semibold text-base sm:text-lg">
                    ${lineTotal.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
