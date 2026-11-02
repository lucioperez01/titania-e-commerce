
import { AdminProductDTO } from "@/Interfaces/dto/product.dto"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { getCategories } from "@/application/use-cases/get-categories"
import { getAdminProducts } from "@/application/use-cases/get-products"
import ProductsClient from "./ProductClient"
export const dynamic = 'force-dynamic';
export default async function ProductPage() {
    const categories: CategoryDTO[] = await getCategories();
    const products: AdminProductDTO[] = await getAdminProducts();

    return (
        <ProductsClient categories={categories} products={products} />
    )
}