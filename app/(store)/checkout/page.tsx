"use client";

import { useState, useTransition } from "react";
import { saveConsent, createOrderAction } from "./actions";
import { useCart } from "@/components/cart/cart-provider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function CheckoutPage() {
  const { state: cartState, dispatch } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mailing, setMailing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressProvince, setAddressProvince] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");

  const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    startTransition(async () => {
      setMessage(null);

      const consentResult = await saveConsent(mailing);
      if (!consentResult.success) {
        setMessage({ type: "error", text: consentResult.error ?? "Error al guardar preferencias." });
        return;
      }

      const orderResult = await createOrderAction({
        fullName,
        email: session.user.email ?? "",
        phone,
        addressLine1,
        addressCity,
        addressProvince,
        addressPostalCode,
      });

      if (orderResult.success) {
        dispatch({ type: "CLEAR" });
        setMessage({ type: "success", text: "Pedido creado con éxito!" });
        router.push("/shop");
      } else {
        setMessage({ type: "error", text: orderResult.error ?? "Error al crear el pedido." });
      }
    });
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-lg border border-slate-200/10 bg-slate-900/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/40">
            <LogIn className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Iniciá sesión</h1>
          <p className="mt-2 text-sm text-white/70">Necesitás iniciar sesión para finalizar tu compra</p>
          <Link
            href="/login?callbackUrl=/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-purple-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Tu carrito está vacío</p>
          <p className="mt-2 text-sm text-white/70">Agregá productos para continuar</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            Ir a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-lg border border-slate-200/10 bg-slate-900/50 p-8">
        <h1 className="text-2xl font-semibold text-white">Finalizar compra</h1>
        <p className="mt-1 text-sm text-white/70">{totalItems} {totalItems === 1 ? "producto" : "productos"} en tu carrito</p>

        {message && (
          <div
            className={`mt-4 rounded p-3 text-sm ${
              message.type === "success" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-white/80">Nombre completo</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/80">Teléfono</label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-white/80">Dirección</label>
            <input
              id="addressLine1"
              type="text"
              required
              value={addressLine1}
              onChange={e => setAddressLine1(e.target.value)}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="addressCity" className="block text-sm font-medium text-white/80">Ciudad</label>
              <input
                id="addressCity"
                type="text"
                required
                value={addressCity}
                onChange={e => setAddressCity(e.target.value)}
                disabled={isPending}
                className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label htmlFor="addressProvince" className="block text-sm font-medium text-white/80">Provincia</label>
              <input
                id="addressProvince"
                type="text"
                required
                value={addressProvince}
                onChange={e => setAddressProvince(e.target.value)}
                disabled={isPending}
                className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="addressPostalCode" className="block text-sm font-medium text-white/80">Código postal</label>
            <input
              id="addressPostalCode"
              type="text"
              required
              value={addressPostalCode}
              onChange={e => setAddressPostalCode(e.target.value)}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-slate-200/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-start gap-3 rounded-md border border-slate-200/10 p-3">
            <input
              type="checkbox"
              id="mailing"
              checked={mailing}
              onChange={(e) => setMailing(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-200/10 text-purple-600 focus:ring-purple-500"
              disabled={isPending}
            />
            <label htmlFor="mailing" className="text-sm text-white/70">
              Recibir ofertas exclusivas y promociones por email
            </label>
          </div>

          {session?.user?.email && (
            <p className="text-xs text-white/50">Pedido asociado a: {session.user.email}</p>
          )}

          <button
            type="submit"
            disabled={isPending || totalItems === 0}
            className="w-full rounded-md bg-purple-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Procesando..." : "Confirmar pedido"}
          </button>
        </form>

        {cartState.isHydrating && (
          <p className="mt-4 text-center text-sm text-white/50">Cargando carrito...</p>
        )}
      </div>
    </div>
  );
}
