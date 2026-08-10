'use server'

import { revalidatePath } from "next/cache"
import { createProduct, CreateProductInput } from "@/application/use-cases/create-product"
import { updateProduct, UpdateProductInput } from "@/application/use-cases/update-product"
import { deleteProduct } from "@/application/use-cases/delete-product"
import { createCategory, CreateCategoryInput } from "@/application/use-cases/create-category"
import { updateCategory, UpdateCategoryInput } from "@/application/use-cases/update-category"
import { deleteCategory } from "@/application/use-cases/delete-category"
import { prisma } from "@/infrastructure/db/prismaClient"

export type ActionResult = { success: boolean; error?: string }

function parseNumber(value: FormDataEntryValue | null): number | undefined {
    if (value == null || value === "") return undefined
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return undefined
    return parsed
}

function parseString(value: FormDataEntryValue | null): string | undefined {
    if (value == null) return undefined
    const text = String(value).trim()
    return text === "" ? undefined : text
}

function parseImageUrls(formData: FormData): string[] {
    return formData.getAll("image")
        .map(value => String(value).trim())
        .filter(url => url !== "")
}

export async function createProductAction(formData: FormData): Promise<ActionResult> {
    try {
        const name = parseString(formData.get("name")) ?? ""
        const price = parseNumber(formData.get("price")) ?? 0
        const stock = parseNumber(formData.get("stock")) ?? 0
        const categoryId = parseNumber(formData.get("categoryId")) ?? 0
        const images = parseImageUrls(formData)

        if (!name) return { success: false, error: "El nombre es obligatorio." }
        if (name.trim().length < 3) return { success: false, error: "El nombre debe tener al menos 3 caracteres." }
        if (price <= 0) return { success: false, error: "El precio debe ser mayor a 0." }
        if (stock < 0) return { success: false, error: "El stock no puede ser negativo." }
        if (!categoryId) return { success: false, error: "Seleccioná una categoría." }
        if (images.length === 0) return { success: false, error: "La URL de la imagen es obligatoria." }

        const input: CreateProductInput = {
            name,
            price,
            stock,
            categoryId,
            brand: parseString(formData.get("brand")),
            description: parseString(formData.get("description")),
            images,
        }

        await createProduct(input)
        revalidatePath("/dashboard/products")
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear el producto."
        return { success: false, error: message }
    }
}

export async function updateProductAction(formData: FormData): Promise<ActionResult> {
    try {
        const id = parseNumber(formData.get("id")) ?? 0
        const name = parseString(formData.get("name"))
        const price = parseNumber(formData.get("price"))
        const stock = parseNumber(formData.get("stock"))
        const images = parseImageUrls(formData)

        if (name !== undefined && !name) return { success: false, error: "El nombre no puede estar vacío." }
        if (price !== undefined && price <= 0) return { success: false, error: "El precio debe ser mayor a 0." }
        if (stock !== undefined && stock < 0) return { success: false, error: "El stock no puede ser negativo." }

        const input: UpdateProductInput = {
            id,
            name,
            price,
            stock,
            brand: parseString(formData.get("brand")),
            description: parseString(formData.get("description")),
            images,
        }

        await updateProduct(input)
        revalidatePath("/dashboard/products")
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error al actualizar el producto."
        return { success: false, error: message }
    }
}

export async function toggleProductOnlineAction(id: number, isOnline: boolean): Promise<ActionResult> {
    try {
        await prisma.product.update({
            where: { id },
            data: { isOnline },
        })
        revalidatePath("/dashboard/products")
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cambiar el estado del producto."
        return { success: false, error: message }
    }
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
    try {
        await deleteProduct(id)
        revalidatePath("/dashboard/products")
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error al eliminar el producto."
        return { success: false, error: message }
    }
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
    try {
        const name = parseString(formData.get("name")) ?? ""
        const image = parseString(formData.get("image"))

        if (!name) return { success: false, error: "El nombre es obligatorio." }
        if (name.trim().length < 3) return { success: false, error: "El nombre debe tener al menos 3 caracteres." }
        if (!image) return { success: false, error: "La URL de la imagen es obligatoria." }

        const input: CreateCategoryInput = {
            name,
            image: parseString(formData.get("image")),
        }

        await createCategory(input)
        revalidatePath("/dashboard/categories")
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear la categoría."
        return { success: false, error: message }
    }
}

export async function updateCategoryAction(formData: FormData): Promise<ActionResult> {
    try {
        const id = parseNumber(formData.get("id")) ?? 0
        const name = parseString(formData.get("name"))

        if (name !== undefined && !name) return { success: false, error: "El nombre no puede estar vacío." }

        const input: UpdateCategoryInput = {
            id,
            name,
            image: parseString(formData.get("image")),
        }

        await updateCategory(input)
        revalidatePath("/dashboard/categories")
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error al actualizar la categoría."
        return { success: false, error: message }
    }
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
    try {
        await deleteCategory(id)
        revalidatePath("/dashboard/categories")
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error al eliminar la categoría."
        return { success: false, error: message }
    }
}