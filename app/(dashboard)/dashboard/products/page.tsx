
import { Button } from "@/components/ui/button"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { ProductImageDTO } from "@/Interfaces/dto/product.dto"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import CreateProductModal from "@/app/(dashboard)/create-product/page"
import { getCategories } from "@/application/use-cases/get-categories"
import { getProducts } from "@/application/use-cases/get-products"
import ProductsClient from "./ProductClient"

export default async function ProductPage() {
    const categories: CategoryDTO[] = await getCategories();
    const products: ProductDTO[] = await getProducts();

    return (
        <ProductsClient categories={categories} products={products} />
    )
}