"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = ["PENDING", "RESERVED", "PAID", "SHIPPED", "DELIVERED"] as const

const STEP_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  RESERVED: "Reservado",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
}

function getStepIndex(status: string): number {
  return STEPS.indexOf(status as (typeof STEPS)[number])
}

export function OrderStatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = getStepIndex(currentStatus)

  if (currentIndex === -1) return null

  return (
    <div className="flex items-center w-full gap-0">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex
        const isCurrent = i === currentIndex
        const isLast = i === STEPS.length - 1

        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            {/* Node */}
            <div className="flex flex-col items-center relative">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  isCompleted && "bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/30",
                  isCurrent && "bg-purple-500 border-purple-400 shadow-md shadow-purple-500/40",
                  !isCompleted && !isCurrent && "bg-white/[0.06] border-white/[0.12]"
                )}
              >
                {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
              <span
                className={cn(
                  "absolute top-8 text-[9px] font-secondary whitespace-nowrap transition-colors",
                  isCompleted && "text-emerald-400/80",
                  isCurrent && "text-purple-300 font-medium",
                  !isCompleted && !isCurrent && "text-white/30"
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 h-[2px] mx-1 rounded-full overflow-hidden bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    i < currentIndex ? "w-full bg-emerald-500/60" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
