"use client"

import { useSearchParams, useRouter } from "next/navigation"

type SizeFilterProps = {
    availableSizes: string[]
}

export default function SizeFilter({ availableSizes }: SizeFilterProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const currentSizes = searchParams.getAll("size")

    function handleSizeChange(size: string, checked: boolean) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("size")

        const next = checked
            ? [...currentSizes, size]
            : currentSizes.filter(s => s !== size)

        for (const s of next) {
            params.append("size", s)
        }

        router.push(`/shop?${params.toString()}`)
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm font-primary text-slate-200 uppercase tracking-wider">Talle</p>
            <div className="flex flex-wrap gap-3">
                {availableSizes.map(size => (
                    <label
                        key={size}
                        className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-300 hover:text-white transition-colors font-primary"
                    >
                        <input
                            type="checkbox"
                            checked={currentSizes.includes(size)}
                            onChange={e => handleSizeChange(size, e.target.checked)}
                            className="accent-purple-500 cursor-pointer"
                        />
                        {size}
                    </label>
                ))}
            </div>
        </div>
    )
}
