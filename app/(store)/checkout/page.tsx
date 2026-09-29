import { Clock } from "lucide-react";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";

  if (!paymentsEnabled) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-lg border border-slate-200/10 bg-slate-900/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/40">
            <Clock className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Pagos próximamente</h1>
          <p className="mt-2 text-sm text-white/70">
            Estamos preparando nuestro sistema de pagos. Volvé en unos días para completar tu compra.
          </p>
        </div>
      </div>
    );
  }

  return <CheckoutForm />;
}
