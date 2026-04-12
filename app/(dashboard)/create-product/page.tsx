'use client'
import { CategoryDTO } from "@/Interfaces/dto/product.dto"

type Props = {
    categories: CategoryDTO[];
    isOpen: boolean;
    onClose: () => void;
}


export default function CreateProductModal({ categories, isOpen, onClose }: Props) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-md shadow-lg w-md">
                <h2 className="text-2xl text-center font-bold font-secondary mb-4">Crear producto</h2>
                <form>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium mb-2">Nombre</label>
                        <input type="text" id="name" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="price" className="block text-sm font-medium mb-2">Precio</label>
                        <input type="number" id="price" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="stock" className="block text-sm font-medium mb-2">Stock</label>
                        <input type="number" id="stock" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="category" className="block text-sm font-medium mb-2">Categoría</label>
                        <input type="text" id="category" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="brand" className="block text-sm font-medium mb-2">Marca</label>
                        <input type="text" id="brand" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium mb-2">Descripción</label>
                        <textarea id="description" className="w-full px-3 max-h-40 py-2 border border-gray-300 rounded-md" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="image" className="block text-sm font-medium mb-2">Imagenes</label>
                        <input type="file" id="image" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex justify-between">
                        <button type="button" className="mr-2 px-4 py-2 font-primary font-bold text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer" onClick={onClose}>Cancelar</button>

                        <button type="submit" className="px-4 py-2 font-primary font-bold bg-blue-500 text-white rounded-md cursor-pointer">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    )
}