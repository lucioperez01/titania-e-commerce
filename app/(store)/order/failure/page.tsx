import { prisma } from "@/infrastructure/db/prismaClient";
import { notFound } from "next/navigation";
import { RetryButton } from "./retry-button";

interface FailurePageProps {
  searchParams: Promise<{ order_id?: string }>;
}

const MAX_RETRIES = 3;
const RETRY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export default async function OrderFailurePage({ searchParams }: FailurePageProps) {
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

  // Calculate retry count (orders created within the retry window for the same user)
  const retryWindowStart = new Date(Date.now() - RETRY_WINDOW_MS);
  const retryCount = await prisma.order.count({
    where: {
      userId: order.userId ?? undefined,
      status: "CANCELLED",
      createdAt: { gte: retryWindowStart },
    },
  });

  const canRetry = retryCount < MAX_RETRIES && order.status === "RESERVED";
  const retriesRemaining = Math.max(0, MAX_RETRIES - retryCount);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600">Pago no procesado</h1>
        <p className="text-gray-600 mt-2">
          No pudimos procesar tu pago. No te preocupes, tu pedido sigue reservado.
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

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${Number(order.total).toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        {canRetry ? (
          <div>
            <p className="text-gray-600 mb-4">
              Te quedan {retriesRemaining} {retriesRemaining === 1 ? "intento" : "intentos"} disponibles
            </p>
            <RetryButton orderId={order.id} />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              Alcanzaste el máximo de intentos
            </p>
            <p className="text-yellow-700 mt-1 text-sm">
              Por favor, contacta a soporte para asistencia con tu pedido #{order.id}.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <a
          href="/"
          className="inline-block text-gray-600 hover:text-gray-800 transition-colors"
        >
          Volver a la tienda
        </a>
      </div>
    </div>
  );
}
