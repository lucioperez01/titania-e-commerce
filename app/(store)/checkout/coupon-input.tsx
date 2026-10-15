"use client";

import { useState, useTransition } from "react";
import { validateCouponAction } from "./coupon-actions";
import { Ticket, X, Check, Loader2 } from "lucide-react";

interface CouponInputProps {
  onCouponApplied?: (
    couponCode: string,
    discountAmount: number,
    promotionId: number
  ) => void;
  onCouponRemoved?: () => void;
}

export function CouponInput({ onCouponApplied, onCouponRemoved }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    discountAmount?: number;
    promotionId?: number;
  } | null>(null);

  const validateCoupon = () => {
    if (!couponCode.trim()) return;

    startTransition(async () => {
      const response = await validateCouponAction(couponCode);

      if (response.success && response.valid && response.promotion) {
        setResult({
          type: "success",
          message: `¡Cupón aplicado! Descuento: $${response.discountAmount?.toLocaleString("es-AR") || "0"}`,
          discountAmount: response.discountAmount,
          promotionId: response.promotion.id,
        });
        onCouponApplied?.(
          couponCode,
          response.discountAmount || 0,
          response.promotion.id
        );
      } else {
        setResult({
          type: "error",
          message: response.error || "Cupón inválido",
        });
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateCoupon();
    }
  };

  const handleRemove = () => {
    setCouponCode("");
    setResult(null);
    onCouponRemoved?.();
  };

  // Si ya hay un cupón aplicado, mostrar el estado
  if (result?.type === "success") {
    return (
      <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="h-4 w-4" />
            <span className="font-medium">{result.message}</span>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-400/60 hover:text-green-400 transition-colors"
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Mostrar input para ingresar cupón
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Código de cupón"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            className="w-full rounded-md border border-slate-200/10 bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={validateCoupon}
          disabled={isPending || !couponCode.trim()}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validando...</span>
            </>
          ) : (
            "Aplicar"
          )}
        </button>
      </div>
      {result?.type === "error" && (
        <p className="text-sm text-red-400">{result.message}</p>
      )}
    </div>
  );
}
