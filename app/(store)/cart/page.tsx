import { getProducts } from "@/application/use-cases/get-products"
import CartPageClient from "@/components/cart/cart-page"

export default async function CartPage() {
    const products = await getProducts()

    return (
        <main className="max-w-6xl mx-auto p-5">
            <CartPageClient products={products} />
        </main>
    )
}
