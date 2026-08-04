import CartItemList from "@/components/cart/cart-item-list"
import { getProducts } from "@/application/use-cases/get-products"

export default async function CartPage() {
    const products = await getProducts()

    return (
        <main className="max-w-4xl mx-auto p-5">
            <h1 className="text-2xl font-bold text-white mb-5">Carrito</h1>
            <CartItemList products={products} />
        </main>
    )
}
