import { Suspense } from "react"
import { PromotionDTO, PromotionFilter } from "@/Interfaces/dto/promotion.dto"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { getPromotions } from "@/application/use-cases/get-promotions"
import { getProducts } from "@/application/use-cases/get-products"
import PromotionsClient from "./PromotionsClient"

export const dynamic = "force-dynamic"

interface PromotionsPageProps {
    searchParams: Promise<{
        status?: string
        type?: string
        search?: string
        page?: string
    }>
}

export default async function PromotionsPage({ searchParams }: PromotionsPageProps) {
    const params = await searchParams
    const page = parseInt(params.page ?? "1", 10)

    const filter: PromotionFilter = {
        page,
        limit: 10,
    }

    if (params.status && ["ACTIVE", "EXPIRED", "SCHEDULED", "INACTIVE"].includes(params.status)) {
        filter.status = params.status as PromotionFilter["status"]
    }

    if (params.type && ["COUPON", "AUTOMATIC"].includes(params.type)) {
        filter.type = params.type as PromotionFilter["type"]
    }

    if (params.search) {
        filter.search = params.search
    }

    const [promotionsResult, products] = await Promise.all([
        getPromotions(filter),
        getProducts(),
    ])

    return (
        <Suspense fallback={<PromotionsSkeleton />}>
            <PromotionsClient
                promotions={promotionsResult.data}
                products={products}
                total={promotionsResult.total}
                page={promotionsResult.page}
            />
        </Suspense>
    )
}

function PromotionsSkeleton() {
    return (
        <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="h-8 w-48 bg-neutral-800 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-neutral-800/60 rounded mt-2 animate-pulse" />
                </div>
                <div className="h-9 w-36 bg-neutral-800 rounded animate-pulse" />
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-neutral-900/20 backdrop-blur-sm shadow-xl">
                <div className="p-6 pb-0">
                    <div className="flex gap-4 border-b border-purple-400/20">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-6 w-20 bg-neutral-800 rounded animate-pulse" />
                        ))}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-neutral-800/40 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    )
}
