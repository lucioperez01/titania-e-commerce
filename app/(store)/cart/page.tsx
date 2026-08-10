import { getProducts } from "@/application/use-cases/get-products"
import CartPageClient from "@/components/cart/cart-page"

export default async function CartPage() {
    const products = await getProducts()

    return (
        <main className="max-w-6xl mx-auto p-5">
            <h1 className="text-2xl font-bold text-white mb-5">Carrito</h1>
            <CartPageClient products={products} />
        </main>
    )
}
