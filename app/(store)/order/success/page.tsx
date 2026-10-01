import { prisma } from "@/infrastructure/db/prismaClient";
import { notFound } from "next/navigation";
import Link from "next/link";

interface SuccessPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { order_id } = await searchParams;

  if (!order_id) {
    notFound();
  }

  const orderId = parseInt(order_id, 10);
  if (isNaN(orderId)) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      shippingAddress: true,
    },
  });

  if (!order) {
    notFound();
  }

  const isPaid = order.status === "PAID";
  const isReserved = order.status === "RESERVED";

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Confirmation Header */}
        {/* Gestalt: Figura-Fondo - Checkmark como punto focal */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative mx-auto mb-6 sm:mb-8 w-20 h-20 sm:w-24 sm:h-24">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-400/50">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Gestalt: Semejanza - Tipografía consistente con marca */}
          <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-white mb-3 sm:mb-4">
            {isPaid ? "Gracias por tu compra" : "Pedido reservado"}
          </h1>
          <p className="text-base sm:text-lg text-purple-100 font-light max-w-md mx-auto leading-relaxed px-4">
            {isPaid
              ? "Tu pedido está confirmado. Estamos preparando cada detalle con el cuidado que merece."
              : "Completá el pago para confirmar tu pedido. Tu reserva es válida por 24 horas."}
          </p>
        </div>

        {/* Order Details Card */}
        {/* Gestalt: Región Común - Contenedor claro para información del pedido */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 sm:p-8 mb-4 sm:mb-6 shadow-xl">
          {/* Order header */}
          {/* Gestalt: Proximidad - Agrupar número y fecha como metadata */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-white/20">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-purple-200 mb-1 sm:mb-2">
                Número de pedido
              </p>
              <p className="text-xl sm:text-2xl font-light text-white">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-purple-200 mb-1 sm:mb-2">
                Fecha
              </p>
              <p className="text-sm sm:text-base text-white/90">
                {new Date(order.createdAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Items */}
          {/* Gestalt: Semejanza - Items con mismo estilo visual */}
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Gestalt: Cierre - Cuadrado con cantidad como unidad visual */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm sm:text-base">{item.quantity}x</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base truncate">{item.product.name}</p>
                    {item.variant && (
                      <p className="text-purple-200 text-xs sm:text-sm truncate">{item.variant.sku}</p>
                    )}
                  </div>
                </div>
                <p className="text-white font-medium text-sm sm:text-base flex-shrink-0 ml-2">
                  ${(Number(item.price) * item.quantity).toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          {/* Gestalt: Continuidad - Línea separadora guía la vista al total */}
          <div className="space-y-2 sm:space-y-3 pt-5 sm:pt-6 border-t border-white/20">
            <div className="flex justify-between">
              <span className="text-purple-200 text-sm sm:text-base">Subtotal</span>
              <span className="text-white/90 text-sm sm:text-base">${Number(order.subtotal).toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-200 text-sm sm:text-base">Envío</span>
              <span className="text-white/90 text-sm sm:text-base">
                {Number(order.shippingCost) === 0 ? "Gratis" : `$${Number(order.shippingCost).toLocaleString("es-AR")}`}
              </span>
            </div>
            {/* Gestalt: Figura-Fondo - Total destacado con mayor contraste */}
            <div className="flex justify-between pt-3 sm:pt-4 border-t border-white/20">
              <span className="text-white font-medium text-base sm:text-lg">Total</span>
              <span className="text-white font-semibold text-xl sm:text-2xl">
                ${Number(order.total).toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {/* Gestalt: Región Común - Dirección como bloque independiente */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 sm:p-8 mb-6 sm:mb-8 shadow-xl">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-purple-200 mb-3 sm:mb-4">
            Dirección de envío
          </p>
          {/* Gestalt: Proximidad - Líneas de dirección agrupadas */}
          <div className="space-y-1 text-white/90 text-sm sm:text-base">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.line1}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.province}
            </p>
            <p>{order.shippingAddress.postalCode}</p>
          </div>
        </div>

        {/* Status Badge + CTA */}
        {/* Gestalt: Destino Común - Acciones finales agrupadas */}
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Status badge */}
          {/* Gestalt: Figura-Fondo - Badge con alto contraste para estado */}
          <div className="inline-block w-full sm:w-auto">
            {isPaid ? (
              <div className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-emerald-500 border-2 border-emerald-400 shadow-lg">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-semibold text-base sm:text-lg">Pago confirmado</span>
                </div>
              </div>
            ) : isReserved ? (
              <div className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-amber-500 border-2 border-amber-400 shadow-lg">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-semibold text-base sm:text-lg">Pendiente de pago</span>
                </div>
              </div>
            ) : (
              <div className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-white/20 border-2 border-white/40">
                <span className="text-white font-semibold text-base sm:text-lg">{order.status}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {/* Gestalt: Semejanza - Botón consistente con marca (blanco sobre púrpura) */}
          <div className="w-full sm:w-auto">
            <Link
              href="/shop"
              className="block sm:inline-block w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-lg bg-white text-purple-900 font-medium transition hover:bg-purple-100 shadow-lg text-center"
            >
              Seguir comprando
            </Link>
          </div>

          {/* Email notification message */}
          {/* Gestalt: Proximidad - Mensaje cercano al CTA como información complementaria */}
          <p className="text-xs sm:text-sm text-purple-200 max-w-md mx-auto px-4">
            Recibirás un email con los detalles de tu pedido
          </p>
        </div>
      </div>
    </div>
  );
}
