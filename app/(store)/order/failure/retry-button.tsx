"use client";

import { useState } from "react";

interface RetryButtonProps {
  orderId: number;
}

export function RetryButton({ orderId }: RetryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: String(orderId) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Error al reintentar el pago");
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("No se obtuvo la URL de pago");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="text-red-600 text-sm mb-2">{error}</p>
      )}
      <button
        onClick={handleRetry}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Procesando..." : "Intentar nuevamente"}
      </button>
    </div>
  );
}
