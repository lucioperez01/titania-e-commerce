import { prisma } from "@/infrastructure/db/prismaClient";
import { notFound } from "next/navigation";

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

  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    PAID: {
      title: "¡Pago confirmado!",
      message: "Tu pedido ha sido pagado exitosamente. Estamos preparando tu pedido.",
      color: "text-green-600",
    },
    RESERVED: {
      title: "Pedido creado",
      message: "Tu pedido fue reservado. Completa el pago para confirmarlo.",
      color: "text-yellow-600",
    },
  };

  const statusInfo = statusMessages[order.status] ?? {
    title: "Pedido recibido",
    message: `Estado del pedido: ${order.status}`,
    color: "text-gray-600",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className={`text-2xl font-bold ${statusInfo.color}`}>{statusInfo.title}</h1>
        <p className="text-gray-600 mt-2">{statusInfo.message}</p>
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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-2">Dirección de envío</h3>
        <p className="text-gray-600">
          {order.shippingAddress.fullName}
          <br />
          {order.shippingAddress.line1}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.province}
          <br />
          {order.shippingAddress.postalCode}
        </p>
      </div>

      <div className="mt-6 text-center">
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
