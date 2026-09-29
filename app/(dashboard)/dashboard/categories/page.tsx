import { getCategories } from "@/application/use-cases/get-categories"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import CategoriesClient from "./CategoriesClient"

export default async function CategoriesPage() {
    const categories: CategoryDTO[] = await getCategories()
    const activeCategories = categories.filter(c => !c.isDeleted)

    return <CategoriesClient categories={activeCategories} />
}
