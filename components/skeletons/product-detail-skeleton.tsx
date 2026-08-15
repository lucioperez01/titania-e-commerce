export default function ProductDetailSkeleton() {
    return (
        <main className="max-w-6xl mx-auto p-5 w-full">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8">
                <div className="w-full aspect-square rounded-md bg-purple-900/40 animate-pulse" />
                <div className="flex flex-col">
                    <div className="h-3 w-20 rounded bg-purple-900/40 animate-pulse" />
                    <div className="h-7 w-3/4 rounded bg-purple-900/40 animate-pulse mt-4" />
                    <div className="h-8 w-1/4 rounded bg-purple-900/40 animate-pulse mt-3" />
                    <div className="h-4 w-1/3 rounded bg-purple-900/40 animate-pulse mt-4" />
                    <div className="h-12 w-full rounded-md bg-purple-900/40 animate-pulse mt-4" />
                    <div className="h-12 w-full rounded-md bg-purple-900/40 animate-pulse mt-3" />
                    <div className="h-16 w-full rounded-md bg-purple-900/40 animate-pulse mt-4" />
                    <div className="h-16 w-full rounded-md bg-purple-900/40 animate-pulse mt-4" />
                </div>
            </div>
        </main>
    )
}
