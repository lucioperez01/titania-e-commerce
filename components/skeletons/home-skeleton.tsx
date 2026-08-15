import ProductCardSkeleton from "./product-card-skeleton"

export default function HomeSkeleton() {
    return (
        <div className="flex flex-col items-center gap-5 p-5 w-full max-w-6xl mx-auto">
            <div className="w-full h-72 sm:h-96 rounded-md bg-purple-900/40 animate-pulse" />
            <div className="h-5 w-1/3 rounded bg-purple-900/40 animate-pulse mx-auto mt-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mt-8 max-w-2xl">
                <ProductCardSkeleton />
                <ProductCardSkeleton />
            </div>
            <div className="h-11 w-52 rounded-md bg-purple-900/40 animate-pulse mx-auto mt-6" />
        </div>
    )
}
