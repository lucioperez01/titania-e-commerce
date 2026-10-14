import { Rating } from "@/components/product/rating"
import Price from "@/components/product/price"
import AddToCartButton from "@/components/cart/add-to-cart-button"
import BuyNowButton from "@/components/cart/buy-now-button"
import WishlistButton from "@/components/wishlist/wishlist-button"
import { LucideCheck } from "lucide-react"
import { LucideTruck } from "lucide-react"
import ProductImageCarousel from "@/components/product/productImageCarousel"
import { getProducts } from "@/application/use-cases/get-products"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const products = await getProducts()
    const product = products.find(p => p.slug === slug)
    
    return {
        title: product?.name ?? "Producto",
    };
}


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

    const sold: number = product.sold ? product.sold : 0
    const rating: number = product.rating ? product.rating : 0
    const oldPrice: number = product.oldPrice ? product.oldPrice : 0

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

                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold truncate">{product.name}</h2>
                    <WishlistButton productId={product.id} />
                </div>

                <div className="lg:flex lg:gap-5">

                    <div className="flex flex-col gap-5 self-center lg:h-full lg:w-full ">
                        <ProductImageCarousel img={product.images.map(img => img.url)} />
                    </div>

                    <div className="flex flex-col gap-2 mt-5">
                        <Price value={product.price} oldValue={oldPrice} />

                        <div className="flex flex-col font-secondary font-extralight gap-2">
                            <li className=" ml-5">Envío gratis en compras superiores a $100.000</li>
                            <li className="ml-5">Devolución gratis</li>
                        </div>

                        <div className="border-t pt-2">
                            <p className="text-xl font-primary font-light">
                                {product.stock > 0
                                    ? `Stock disponible: ${product.stock}`
                                    : "Sin stock"
                                }
                            </p>
                        </div>

                        {(product.size || product.width || product.length) && (
                            <div className="border-t pt-2">
                                <p className="text-sm text-slate-300 font-primary">
                                    {product.size && `Talle: ${product.size}`}
                                    {product.width && `${product.size ? " | " : ""}Ancho: ${product.width}cm`}
                                    {product.length && `${(product.size || product.width) ? " | " : ""}Largo: ${product.length}cm`}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-3">
                            <BuyNowButton productId={product.id} stock={product.stock} />

                            <AddToCartButton productId={product.id} stock={product.stock} />
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
