export default function ProductCardSkeleton() {
    return (
        <div className="rounded-md border border-slate-200/10 p-3 w-full">
            <div className="w-full aspect-square rounded-md bg-purple-900/40 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-purple-900/40 animate-pulse mt-3" />
            <div className="h-4 w-1/4 rounded bg-purple-900/40 animate-pulse mt-2" />
        </div>
    )
}
