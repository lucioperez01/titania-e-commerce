import { prisma } from "@/infrastructure/db/prismaClient";
import { notFound } from "next/navigation";

interface PendingPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function OrderPendingPage({ searchParams }: PendingPageProps) {
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
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-yellow-600">Pago pendiente</h1>
        <p className="text-gray-600 mt-2">
          Tu pedido fue reservado. Estamos esperando la confirmación del pago.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Pedido #{order.id} — {new Date(order.createdAt).toLocaleDateString("es-AR")}
        </h2>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 border-b">
              <div>
                <span className="font-medium">{item.product.name}</span>
                {item.variant && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({item.variant.sku})
                  </span>
                )}
                <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
              </div>
              <span className="font-medium">
                ${(Number(item.price) * item.quantity).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${Number(order.subtotal).toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Envío</span>
            <span>{Number(order.shippingCost) === 0 ? "Gratis" : `$${Number(order.shippingCost).toLocaleString("es-AR")}`}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${Number(order.total).toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-blue-800 font-semibold mb-1">¿Qué sucede ahora?</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Tu pedido está reservado por 24 horas</li>
          <li>• Recibirás un email cuando el pago sea confirmado</li>
          <li>• Si el pago no se confirma en 24h, la reserva se cancelará automáticamente</li>
        </ul>
      </div>

      <div className="text-center">
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a la tienda
        </a>
      </div>
    </div>
  );
}
