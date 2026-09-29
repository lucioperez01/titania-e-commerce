"use client";

import { useState } from "react";
import { shipOrderAction, cancelOrderAction } from "./actions";

export function ShipOrderButton({ orderId }: { orderId: number }) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const result = await shipOrderAction(orderId, tracking);
    setLoading(false);
    if (result.success) {
      setOpen(false);
      setTracking("");
    } else {
      setError(result.error ?? "Error al enviar el pedido");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Marcar como enviado
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-purple-400/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Marcar pedido como enviado</h3>
            <p className="text-sm text-slate-300 mb-4">
              Ingresá el número de seguimiento para el pedido #{orderId}.
            </p>

            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Número de seguimiento"
              className="w-full bg-neutral-800 border border-purple-400/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 mb-3"
              autoFocus
            />

            {error && (
              <p className="text-sm text-red-400 mb-3">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  setTracking("");
                  setError(null);
                }}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !tracking.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? "Enviando..." : "Confirmar envío"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CancelOrderButton({ orderId }: { orderId: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const result = await cancelOrderAction(orderId);
    setLoading(false);
    if (result.success) {
      setOpen(false);
    } else {
      setError(result.error ?? "Error al cancelar el pedido");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Cancelar pedido
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-red-400/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Cancelar pedido</h3>
            <p className="text-sm text-slate-300 mb-4">
              ¿Estás seguro de que querés cancelar el pedido #{orderId}?
              {""} Esta acción liberará el stock reservado y no se puede deshacer.
            </p>

            {error && (
              <p className="text-sm text-red-400 mb-3">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
