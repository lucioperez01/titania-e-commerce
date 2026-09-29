import { BarChart3 } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"

export default function EstadisticasPage() {
    return (
        <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    Estadísticas
                </h1>
                <p className="text-sm text-slate-400">
                    Métricas avanzadas y reportes detallados
                </p>
            </div>

            <div className="mt-8 rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                <EmptyState
                    icon={BarChart3}
                    title="Próximamente"
                    description="Próximamente tendrás métricas avanzadas y reportes detallados"
                    action={{ label: "Volver al Dashboard", href: "/dashboard" }}
                />
            </div>
        </div>
    )
}
