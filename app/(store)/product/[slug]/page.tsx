import { ProductRepositoryMock } from "@/infrastructure/repositories/product-repository-mock"
import { Rating } from "@/components/product/rating"
import Price from "@/components/product/price"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LucideCheck } from "lucide-react"
import { LucideTruck } from "lucide-react"
import ProductImageCarousel from "@/components/product/productImageCarousel"
import { getProducts } from "@/application/use-cases/get-products"


export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {

    const { slug } = await params
    const products = await getProducts()
    const product = products.find(p => p.slug === slug)


    if (!product) {
        return <div>Producto no encontrado</div>
    }

    let sold: number = product.sold ? product.sold : 0
    let rating: number = product.rating ? product.rating : 0
    let oldPrice: number = product.oldPrice ? product.oldPrice : 0

    return (
        <main className="max-w-6xl mx-auto flex flex-col items-center gap-3 ">
            <div className="text-white flex flex-col gap-3 w-sm lg:w-4xl xl:w-6xl border rounded-md border-slate-200/10 p-5 m-5">
                <div className="flex items-center justify-between text-sm border-b border-purple-400/50">
                    <p className="font-primary ">{sold} vendidos</p>
                    <div className="flex items-center gap-2 font-primary">
                        <p>{product.rating}</p>
                        <Rating value={rating} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold truncate w-full ">{product.name}</h2>

                <div className="lg:flex lg:gap-5">

                    <div className="flex flex-col gap-5 self-center lg:h-full lg:w-full ">
                        <ProductImageCarousel img={product.images.map(img => img.url)} />
                    </div>

                    <div className="flex flex-col gap-2 mt-5">
                        <Price value={product.price} oldValue={oldPrice} />

                        <div className="flex flex-col font-secondary font-extralight gap-2">
                            <li className=" ml-5">Envio gratis</li>
                            <li className="ml-5">Devolucion gratis</li>
                        </div>

                        <div className="border-t pt-2">
                            <p className="text-xl font-primary font-light">Stock disponible: 2</p>
                        </div>

                        <div className="flex flex-col gap-3 mt-3">
                            <Link href="#">
                                <Button variant="outline" className="w-full cursor-pointer text-black text-md font-light font-primary py-5">Comprar ahora</Button>
                            </Link>

                            <Link href="#">
                                <Button variant="outline" className="w-full bg-transparent cursor-pointer text-white text-md font-light font-primary py-5">Agregar al carrito 🛒</Button>
                            </Link>
                        </div>

                        <div className="flex flex-col gap-2 mt-5">
                            <div className="w-full h-20 flex gap-3 items-center bg-linear-to-br from-purple-600/60 to-purple-800/40 p-3 rounded-md border">
                                <LucideTruck size={50} />
                                <p>Conseguí un descuento de 20% armando tu carrito Titania con un monto mayor a AR$ 50.000</p>
                            </div>

                            <div className="flex gap-3 items-center bg-linear-to-br from-purple-600/60 to-purple-800/40 p-3 rounded-md border">
                                <LucideCheck size={50} className="text-purple-200" />
                                Compra Protegida. Recibí el producto que esperabas o te devolvemos tu dinero.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
