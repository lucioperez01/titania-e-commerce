'use client'

import { useState } from "react"
import CreateProductModal from "@/app/(dashboard)/create-product/page"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { Button } from "@/components/ui/button"

export default function ProductsClient({ categories, products }: { categories: CategoryDTO[], products: ProductDTO[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <main className="w-full flex items-center justify-center">
                <div className="mt-5 w-xl lg:w-4xl">
                    <h1 className="text-4xl font-bold text-white">Productos</h1>
                    <p className="text-md text-slate-200">Aquí puedes ver y gestionar tus productos.</p>

                    {isModalOpen && <CreateProductModal categories={categories} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
                    {isModalOpen && (
                        <CreateProductModal
                            categories={categories}
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                        />
                    )}

                    <div className="font-primary font-bold w-full max-w-4xl text-white mt-4 border border-white rounded-lg shadow-lg bg-neutral-800/30">
                        <table className="w-full text-white">
                            <thead className="w-full bg-linear-to-l from-purple-600/20 to-purple-600/30">
                                <tr className="text-md">
                                    <th className="text-center py-2 ">Nombre</th>
                                    <th className="text-center py-2">Precio</th>
                                    <th className="text-center py-2">Stock</th>
                                    <th className="text-center py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="w-full text-white">
                                {products.map((p) => (
                                    <tr key={p.id} className="w-full font-secondary bg-linear-to-r from-purple-600/30 to-purple-600/50 items-center justify-between   hover:bg-purple-600/60 transition-colors group cursor-pointer">
                                        <td className="text-center px-3 py-2"> {p.name}</td>
                                        <td className="text-center px-3 py-2"> {p.price}</td>
                                        <td className="text-center px-3 py-2"> {p.stock}</td>
                                        <td className="text-center px-3 py-2">
                                            <Button variant="outline" className="font-secondary font-extrabold  text-slate-600 border-neutral-700/30 hover:cursor-pointer gap-2 h-6 w-13">
                                                Editar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                    {products.length === 0 && (
                        <h2 className="text-center text-white mt-4">No hay productos...</h2>
                    )}
                    <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-4 w-full font-secondary font-extrabold border-neutral-700/80 hover:cursor-pointer h-10 w-full bg-purple-600/40 text-white transition-colors border-slate-200 border-1">
                        Agregar producto
                    </Button>

                </div>
            </main>
        </>
    )
}