import ProductCard from "@/components/product/product-card"
import { getProducts } from "@/application/use-cases/get-products"
import { searchProducts } from "@/application/use-cases/search-products"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import SizeFilter from "@/components/shop/size-filter"
import { Suspense } from "react"
import type { Metadata } from "next"

type ShopSearchParams = {
    category?: string
    search?: string
    size?: string | string[]
}

export function generateMetadata({ searchParams }: { searchParams: Promise<ShopSearchParams> }): Metadata {
    return {
        title: "Catálogo",
    };
}

function normalizeSizes(raw: string | string[] | undefined): string[] {
    if (!raw) return []
    return Array.isArray(raw) ? raw.filter(Boolean) : [raw]
}

export default async function Shop({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
    const { category, search, size } = await searchParams
    const sizes = normalizeSizes(size)

    const products: ProductDTO[] = search
        ? await searchProducts(search, 20, sizes.length > 0 ? sizes : undefined)
        : await getProducts({ onlyOnline: true, categorySlug: category, sizes: sizes.length > 0 ? sizes : undefined })

    const productRepo = new PrismaProductRepository()
    const availableSizes = await productRepo.findAvailableSizes()
    
    let categoryTitle = "¡Echa un vistazo a nuestros productos!"
    let categoryDescription: string | undefined
    if (search) {
        categoryTitle = `Resultados para: "${search}"`
    } else if (category) {
        const categoryRepo = new PrismaCategoriesRepository()
        const categoryData = await categoryRepo.findBySlug(category)
        if (categoryData) {
            categoryTitle = categoryData.name
            categoryDescription = categoryData.description
        } else {
            categoryTitle = "Categoría no encontrada"
        }
    }

    if (products.length === 0) {
        return <div className="text-2xl text-white text-center">No hay productos</div>
    }
    return (
        <section className="flex flex-col justify-between items-center gap-5 ">
            <div className="text-2xl text-white text-center">
                <h1 className="font-medium font-secondary ">{categoryTitle}</h1>
                {categoryDescription && (
                    <p className="text-sm text-slate-300 mt-2 max-w-xl mx-auto text-center">
                        {categoryDescription}
                    </p>
                )}
            </div>

            {availableSizes.length > 0 && (
                <Suspense>
                    <SizeFilter availableSizes={availableSizes} />
                </Suspense>
            )}

            <div className="flex flex-col justify-items-center gap-10 ">
                <div className=" flex flex-col justify-center items-center gap-8 lg:grid lg:grid-cols-2 ">
                    {products.map((p) => (
                        <ProductCard key={p.id} p={p} />
                    ))}
                </div>

                <p className="text-sm text-center text-white">Contamos con envíos a todo el país y una política de devolución clara.</p>
            </div>
        </section>
    )
}