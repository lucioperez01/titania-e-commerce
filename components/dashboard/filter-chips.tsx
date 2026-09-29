'use client'

interface FilterChip {
    label: string
    value: string
    onRemove: () => void
}

interface FilterChipsProps {
    chips: FilterChip[]
    onClearAll?: () => void
}

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
    if (chips.length === 0) return null

    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-neutral-900/80 backdrop-blur-sm py-3">
            {chips.map((chip) => (
                <span
                    key={chip.value}
                    className="flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-600/20 px-3 py-1.5 text-sm text-slate-200"
                >
                    <span className="text-slate-400">{chip.label}:</span>
                    <span className="text-white">{chip.value}</span>
                    <button
                        onClick={chip.onRemove}
                        className="rounded-full p-0.5 transition-colors hover:bg-red-500/20"
                        aria-label={`Remove ${chip.label} filter`}
                    >
                        <svg
                            className="h-3 w-3 text-slate-400 hover:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </span>
            ))}

            {onClearAll && chips.length > 1 && (
                <button
                    onClick={onClearAll}
                    className="text-xs text-slate-400 hover:text-white transition-colors underline"
                >
                    Limpiar todo
                </button>
            )}
        </div>
    )
}
