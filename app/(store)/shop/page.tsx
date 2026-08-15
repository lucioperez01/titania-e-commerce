import ProductCard from "@/components/product/product-card"
import { getProducts } from "@/application/use-cases/get-products"
import { searchProducts } from "@/application/use-cases/search-products"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { PrismaCategoriesRepository } from "@/infrastructure/repositories/PrismaCategoryRepository"

export default async function Shop({ searchParams }: { searchParams: Promise<{ category?: string; search?: string }> }) {
    const { category, search } = await searchParams
    const products: ProductDTO[] = search
        ? await searchProducts(search)
        : await getProducts({ onlyOnline: true, categorySlug: category })
    
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