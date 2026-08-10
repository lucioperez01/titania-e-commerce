'use client'

import { useState } from "react"
import ProductModal from "@/components/dashboard/product-modal"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { Button } from "@/components/ui/button"
import { createProductAction, deleteProductAction, updateProductAction, toggleProductOnlineAction } from "@/app/(dashboard)/actions"

export default function ProductsClient({ categories, products }: { categories: CategoryDTO[], products: ProductDTO[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")
    const [onlineStatuses, setOnlineStatuses] = useState<Record<number, boolean>>(() =>
        Object.fromEntries(products.map((p) => [p.id, p.isOnline]))
    )

    const openCreate = () => {
        setSelectedProduct(null)
        setMode("create")
        setIsModalOpen(true)
    }

    const openEdit = (product: ProductDTO) => {
        setSelectedProduct(product)
        setMode("edit")
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que querés eliminar este producto?")) {
            return
        }
        await deleteProductAction(id)
    }

    const handleToggleOnline = async (product: ProductDTO) => {
        const next = !onlineStatuses[product.id]
        setOnlineStatuses((prev) => ({ ...prev, [product.id]: next }))
        await toggleProductOnlineAction(product.id, next)
    }

    return (
        <>
            <ProductModal
                categories={categories}
                product={selectedProduct ?? undefined}
                isOpen={isModalOpen}
                mode={mode}
                onClose={() => setIsModalOpen(false)}
                action={mode === "edit" ? updateProductAction : createProductAction}
            />

            <main className="max-w-full flex items-center justify-center">
                <div className="mt-5 max-w-full lg:w-5xl">
                    <h1 className="text-4xl font-bold text-white">Productos</h1>
                    <p className="text-md text-slate-200">Aquí puedes ver y gestionar tus productos.</p>

                    <div className="font-primary font-bold w-full text-white mt-4 rounded-lg shadow-lg bg-neutral-800/30 hidden lg:block overflow-x-auto">
                        <table className="w-full text-white min-w-175">
                            <thead className="w-full bg-linear-to-l from-purple-600/20 to-purple-600/30">
                                <tr className="text-xs font-primary font-bold text-white lg:text-lg">
                                    <th className="text-center p-3">Imagen</th>
                                    <th className="text-center p-3">Nombre</th>
                                    <th className="text-center p-3">Precio</th>
                                    <th className="text-center p-3">Stock</th>
                                    <th className="text-center p-3">Categoría</th>
                                    <th className="text-center p-3">Online</th>
                                    <th className="text-center p-3">Acciones</th>
                                </tr>
                            </thead>
                            
                            <tbody className="w-full text-white text-xs lg:text-lg">
                                {products.map((p) => (
                                    <tr key={p.id} className="w-full font-secondary bg-linear-to-r from-purple-600/30 to-purple-600/50 items-center justify-between hover:bg-purple-600/60 transition-colors group cursor-pointer">
                                        <td className="text-center  py-1">
                                            {p.images && p.images.length > 0 && (
                                                    <img
                                                        src={p.images[0].url}
                                                        alt={p.name}
                                                        className="w-10 h-10 m-auto object-cover rounded-md"
                                                    />
                                                )}
                                        </td>
                                        <td className="text-center w-3 truncate">{p.name}</td>
                                        <td className="text-center">{p.price}</td>
                                        <td className="text-center">{p.stock}</td>
                                        <td className="text-center truncate">{p.category.name}</td>
                                        <td className="text-center px-1 py-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleOnline(p)}
                                                aria-label="cambiar estado"
                                                className={`text-xs lg:text-md font-secondary font-extrabold hover:cursor-pointer gap-2 h-6 w-20 ${onlineStatuses[p.id] ? "bg-green-500/30 text-green-100 border-green-400" : "bg-red-500/30 text-red-100 border-red-400"}`}
                                            >
                                                {onlineStatuses[p.id] ? "Online" : "Offline"}
                                            </Button>
                                        </td>
                                        <td className="text-center px-3 py-2">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="text-xs lg:text-md font-secondary font-extrabold text-slate-600 border-neutral-700/30 hover:cursor-pointer gap-2 h-6 w-13 "
                                                    onClick={() => openEdit(p)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="text-xs lg:text-md font-secondary font-bold hover:cursor-pointer gap-2 h-6 w-15 bg-red-600/30 text-red-100 border-red-400"
                                                    onClick={() => handleDelete(p.id)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        
                    </div>

                    {/* Mobile */}
                    <div className="mt-5 lg:hidden max-w-full space-y-5 w-xl ">
                    {products.map((product) => (
                        
                        <div
                            key={product.id}
                            className="rounded-lg p-5 shadow-lg bg-linear-to-r from-purple-400 to transparent text-2xl text-white font-primary"
                        >
                            
                        <div className="flex items-center gap-3 text-white">
                            {product.images.length > 0 && (
                            <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-12 w-9 rounded-md object-cover"
                            />
                            )}

                            <div className="flex-2 min-w-0 grid grid-cols-[1fr_100px] gap-1">
                                
                            <h3 className="font-medium truncate">
                                {product.name} 
                            </h3>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleOnline(product)}
                                aria-label="cambiar estado"
                                className={`grid-cols-2 justify-self-end text-xs lg:text-md font-secondary font-extrabold hover:cursor-pointer w-20 ${onlineStatuses[product.id] ? "bg-green-500/30 text-white border-green-600" : "bg-red-500/30 text-red-100 border-red-400"}`}
                                >
                                {onlineStatuses[product.id] ? "Online" : "Offline"}
                            </Button>
                            
                            <p className="text-sm text-white/80 truncate">
                                {product.category.name} 
                            </p>

                            
                            </div>
                        </div>
                        

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                            <p className="text-white/80">Precio</p>
                            <p className="font-medium">${product.price}</p>
                            </div>

                            <div>
                            <p className="text-white/80">Stock</p>
                            <p className="font-medium">{product.stock}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 text-xs px-3 py-4 lg:text-md font-secondary text-slate-600 border-neutral-700/30 hover:cursor-pointer gap-2 h-6 w-13 "
                                onClick={() => openEdit(product)}
                            >
                                Editar
                            </Button>
                            
                            <Button
                                variant="destructive"
                                className="flex-1 text-xs px-3 py-4 lg:text-md font-secondary font-bold hover:cursor-pointer gap-2 h-6 w-15 bg-red-500/80 text-red-100 border-red-400"
                                onClick={() => handleDelete(product.id)}
                            >
                                Eliminar
                            </Button>
                            
                        </div>
                        </div>
                    ))}
                    </div>
                    
                    {products.length === 0 && (
                        <h2 className="text-center text-white mt-4">No hay productos...</h2>
                    )}

                    
                    <Button
                        onClick={openCreate}
                        variant="outline"
                        className="mt-4 font-secondary font-bold hover:cursor-pointer h-10 w-full bg-purple-600/40 text-white transition-colors  hover:bg-purple-600/60 hover:text-white border-purple-600/50 hover:border-white/70"
                    >
                        Agregar producto
                    </Button>

                    <p className="mt-5 text-sm text-slate-100 p-5">*Los productos que estén en estado "Offline" no serán visibles para los clientes.</p>
                    
                </div>

                
            </main>
        </>
    )
}
