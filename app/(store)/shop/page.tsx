import ProductCard from "@/components/product/product-card"
import { getProducts } from "@/application/use-cases/get-products"
import { ProductDTO } from "@/Interfaces/dto/product.dto"

export default async function Shop() {
    let products: ProductDTO[] = await getProducts()

    if (products.length === 0) {
        return <div className="text-2xl text-white text-center">No hay productos</div>
    }
    return (
        <section className="flex flex-col justify-between items-center gap-5 ">
            <div className="text-2xl text-white text-center">
                <h1 className="font-medium font-secondary ">¡Echa un vistazo a nuestros productos!</h1>
                <p className="text-sm">Nuestra selección se centra en la calidad de los materiales y accesibilidad</p>
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