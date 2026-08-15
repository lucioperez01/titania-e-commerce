import { NextRequest, NextResponse } from "next/server"
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository"
import { productToDTO } from "@/Interfaces/dto/product.dto"

export async function GET(request: NextRequest) {
    const idsParam = request.nextUrl.searchParams.get("ids")
    const repo = new PrismaProductRepository()

    if (idsParam) {
        const ids = idsParam.split(",").map(Number).filter(id => !isNaN(id))
        if (ids.length === 0) {
            return NextResponse.json([])
        }
        const products = await Promise.all(ids.map(id => repo.findById(id)))
        const dtos = products.filter(p => p !== null).map(p => productToDTO(p!))
        return NextResponse.json(dtos)
    }

    return NextResponse.json([])
}
