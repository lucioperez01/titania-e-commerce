import ProductCardSkeleton from "./product-card-skeleton"

export default function ShopSkeleton() {
    return (
        <section className="flex flex-col items-center gap-5 p-5 w-full max-w-6xl mx-auto">
            <div className="h-6 w-1/2 rounded bg-purple-900/40 animate-pulse mx-auto" />
            <div className="h-4 w-1/3 rounded bg-purple-900/40 animate-pulse mx-auto mt-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mt-5">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
            <div className="h-3 w-2/3 rounded bg-purple-900/40 animate-pulse mx-auto mt-8" />
        </section>
    )
}
