"use client";

import { useState } from "react";
import { saveConsent } from "./actions";
import { useCart } from "@/components/cart/cart-provider";
import { useSession } from "next-auth/react";

export default function CheckoutPage() {
  const { state: cartState } = useCart();
  const { data: session } = useSession();
  const [mailing, setMailing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await saveConsent(mailing);

      if (result.success) {
        setMessage({ type: "success", text: "Preferencias guardadas correctamente." });
      } else {
        setMessage({ type: "error", text: result.error || "Error al guardar preferencias." });
      }
    } catch {
      setMessage({ type: "error", text: "Error inesperado al procesar su pedido." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Finalizar compra</h1>

        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Cart summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">Resumen del carrito</h2>
          {totalItems === 0 ? (
            <p className="text-sm text-gray-500">Tu carrito está vacío.</p>
          ) : (
            <div>
              <p className="text-sm">
                {totalItems} {totalItems === 1 ? "producto" : "productos"} en tu carrito
              </p>
              <ul className="mt-2 space-y-1">
                {cartState.items.map((item, index) => (
                  <li key={`${item.productId}-${item.variantId ?? "none"}-${index}`} className="text-sm text-gray-600">
                    Producto #{item.productId} × {item.quantity}
                    {item.variantId && <span className="text-gray-400"> (variante: {item.variantId})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Marketing consent checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="mailing"
              checked={mailing}
              onChange={(e) => setMailing(e.target.checked)}
              className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              disabled={isSubmitting}
            />
            <label htmlFor="mailing" className="text-sm text-gray-700">
              Obtenga ofertas exclusivas — acceda a descuentos y promociones solo por email
            </label>
          </div>

          {/* Session info */}
          {session?.user?.email && (
            <p className="text-xs text-gray-500">
              Pedido asociado a: {session.user.email}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || totalItems === 0}
            className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Procesando..." : "Confirmar pedido"}
          </button>
        </form>

        {cartState.isHydrating && (
          <p className="mt-4 text-center text-sm text-gray-500">Cargando carrito...</p>
        )}
      </div>
    </div>
  );
}
