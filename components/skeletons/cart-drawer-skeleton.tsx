export default function CartDrawerSkeleton() {
    return (
        <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 border-b border-purple-500/10">
                    <div className="w-16 h-16 rounded-md bg-purple-900/40 animate-pulse shrink-0" />
                    <div className="flex-1 flex flex-col">
                        <div className="h-3 w-24 rounded bg-purple-900/40 animate-pulse" />
                        <div className="h-3 w-16 rounded bg-purple-900/40 animate-pulse mt-1" />
                        <div className="flex gap-1 mt-2">
                            <div className="w-6 h-6 rounded bg-purple-900/40 animate-pulse" />
                            <div className="w-6 h-6 rounded bg-purple-900/40 animate-pulse" />
                            <div className="w-6 h-6 rounded bg-purple-900/40 animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
            <div className="h-4 w-1/3 rounded bg-purple-900/40 animate-pulse mt-3 mx-auto" />
        </div>
    )
}
