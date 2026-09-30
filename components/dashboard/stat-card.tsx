import { type LucideIcon } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    trend?: { value: number; label: string }
    variant?: "hero" | "secondary"
}

export function StatCard({ title, value, icon, trend, variant = "secondary" }: StatCardProps) {
    const isHero = variant === "hero"

    return (
        <div
            className={`rounded-xl border shadow-xl backdrop-blur-sm ${
                isHero
                    ? "col-span-1 md:col-span-2 row-span-2 h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30 p-6 md:p-8 flex flex-col justify-center"
                    : "bg-neutral-900/20 border-purple-400/20 p-5 hover:bg-neutral-800/40 transition-all"
            }`}
        >
            <div className={`flex items-center justify-between ${isHero ? "mb-4" : "mb-2"}`}>
                <h3
                    className={`font-medium uppercase tracking-wide text-slate-300 ${
                        isHero ? "text-sm" : "text-xs"
                    }`}
                >
                    {title}
                </h3>
                <div
                    className={`flex items-center justify-center rounded-lg ${
                        isHero
                            ? "bg-purple-500/20 p-3"
                            : "bg-neutral-800 p-2"
                    }`}
                >
                    {icon}
                </div>
            </div>

            <div
                className={`font-bold text-white ${
                    isHero ? "text-4xl md:text-5xl" : "text-2xl"
                }`}
            >
                {value}
            </div>

            {trend && (
                <div className={`flex items-center gap-1.5 ${isHero ? "mt-4" : "mt-2"}`}>
                    {trend.value >= 0 ? (
                        <svg
                            className="h-4 w-4 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 17l9.2-9.2M17 17V7H7"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="h-4 w-4 text-rose-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 7l-9.2 9.2M7 7v10h10"
                            />
                        </svg>
                    )}
                    <span
                        className={`text-sm font-medium ${
                            trend.value >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                        {trend.value >= 0 ? "+" : ""}
                        {trend.value}%
                    </span>
                    <span className="text-xs text-slate-400">{trend.label}</span>
                </div>
            )}
        </div>
    )
}
