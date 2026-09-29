import { getOrderDetailAction } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShipOrderButton, CancelOrderButton } from "../order-actions";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderDetailAction(orderId);

  if (!order) {
    notFound();
  }

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    RESERVED: "Reservado",
    PAID: "Pagado",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
    EXPIRED: "Expirado",
    RETURNED: "Devuelto",
    REFUNDED: "Reembolsado",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    RESERVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PAID: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    SHIPPED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    DELIVERED: "bg-green-500/20 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
    EXPIRED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    RETURNED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    REFUNDED: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };

  return (
    <div className="flex flex-col gap-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/orders"
            className="text-sm text-purple-400 hover:text-purple-300 mb-2 inline-block"
          >
            &larr; Volver a pedidos
          </Link>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Pedido #{order.id}
          </h1>
          <p className="text-slate-300 mt-1">
            {order.createdAt.toLocaleDateString("es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex gap-2">
          {order.status === "PAID" && (
            <>
              <ShipOrderButton orderId={order.id} />
              <CancelOrderButton orderId={order.id} />
            </>
          )}
          {order.status === "RESERVED" && (
            <CancelOrderButton orderId={order.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Información del cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-300">Nombre</p>
                <p className="text-sm font-medium">{order.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Email</p>
                <p className="text-sm font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Teléfono</p>
                <p className="text-sm font-medium">{order.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Estado</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Dirección de envío</h2>
            <div className="text-sm space-y-1">
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.province}
              </p>
              <p>CP: {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Productos</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50"
                >
                  <div>
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-slate-300">
                      Cantidad: {item.quantity} × ${Number(item.price).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    ${(Number(item.price) * item.quantity).toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-purple-400/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Subtotal</span>
                <span>${Number(order.subtotal).toLocaleString("es-AR")}</span>
              </div>
              {order.shippingCost && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Envío</span>
                  <span>${Number(order.shippingCost).toLocaleString("es-AR")}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-purple-400/30">
                <span>Total</span>
                <span className="text-purple-400">${Number(order.total).toLocaleString("es-AR")}</span>
              </div>
            </div>
          </div>

          {order.shippingId && (
            <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">Envío</h2>
              <div>
                <p className="text-xs text-slate-300">Número de seguimiento</p>
                <p className="text-sm font-mono font-medium">{order.shippingId}</p>
              </div>
              {order.shippingProvider && (
                <div className="mt-2">
                  <p className="text-xs text-slate-300">Transportista</p>
                  <p className="text-sm font-medium">{order.shippingProvider}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Resumen</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Proveedor de pago</span>
                <span className="font-medium">{order.paymentProvider ?? "N/A"}</span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-300">ID de pago</span>
                  <span className="font-mono text-xs">{order.paymentId}</span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-slate-300">Fecha de pago</span>
                  <span className="font-medium">
                    {new Date(order.paidAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-purple-400 bg-neutral-900/20 backdrop-blur-sm p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Historial</h2>
            <div className="space-y-3">
              {order.transitions.length === 0 ? (
                <p className="text-sm text-slate-300">Sin transiciones registradas</p>
              ) : (
                order.transitions.map((transition) => (
                  <div key={transition.id} className="relative pl-6">
                    <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-purple-400" />
                    <div className="absolute left-1.5 top-4 w-px h-full bg-purple-400/30" />
                    <div>
                      <p className="text-xs text-slate-300">
                        {new Date(transition.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm font-medium">
                        {statusLabels[transition.previousStatus]} &rarr; {statusLabels[transition.newStatus]}
                      </p>
                      <p className="text-xs text-slate-300">
                        Por: {transition.trigger}
                        {transition.reason && ` — ${transition.reason}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
