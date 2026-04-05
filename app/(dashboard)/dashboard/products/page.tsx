"use client"
import { Button } from "@/components/ui/button"
import { ProductDTO } from "@/Interfaces/dto/product.dto"
import { ProductImageDTO } from "@/Interfaces/dto/product.dto"
import { CategoryDTO } from "@/Interfaces/dto/product.dto"

export default function ProductPage() {



    const categories: CategoryDTO[] = [
        {
            id: 1,
            name: "categoria-1",
            slug: "cat1"
        },
        {
            id: 2,
            name: "categoria-2",
            slug: "cat2"
        },
        {
            id: 3,
            name: "categoria-3",
            slug: "cat3"
        },
    ]

    const images: ProductImageDTO[] = [
        {
            id: 1,
            url: "producto-1.jpg",
        },
        {
            id: 2,
            url: "producto-2.jpg",
        },
        {
            id: 3,
            url: "producto-3.jpg",
        },
    ]

    const products: ProductDTO[] = [
        {
            id: 1,
            name: "Producto 1",
            price: 10,
            stock: 10,
            slug: "producto-1",
            images: images.filter(image => image.id === 1),
            category: categories.filter(category => category.id === 1)[0],
            brand: "marca-1",
        },
        {
            id: 2,
            name: "Producto 2",
            price: 20,
            stock: 20,
            slug: "producto-2",
            images: images.filter(images => images.id === 2),
            category: categories.filter(category => category.id === 2)[0],
            brand: "marca-2",
        },
        {
            id: 3,
            name: "Producto 3",
            price: 30,
            stock: 30,
            slug: "producto-3",
            images: images.filter(images => images.id === 3),
            category: categories.filter(category => category.id === 3)[0],
            brand: "marca-3",
        },
    ]

    return (
        <div className="mt-5">
            <h1 className="text-2xl font-bold text-white">Productos</h1>
            <p className="text-md text-slate-200">Aquí puedes ver y gestionar tus productos.</p>

            <div className="font-primary font-bold w-full max-w-4xl text-white mt-4 border border-white rounded-lg shadow-lg bg-neutral-800/30">
                <table className="w-full text-white">
                    <caption>
                        <p className="text-xl font-bold text-white">Productos</p>
                    </caption>
                    <thead className="">
                        <tr>
                            <th className="text-center">Nombre</th>
                            <th className="text-center">Precio</th>
                            <th className="text-center">Stock</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id} className="flex flex-row items-center justify-between px-3 py-2 rounded-lg hover:bg-purple-600/60 transition-colors group cursor-pointer">
                                <td className="text-center"> {p.name}</td>
                                <td className="text-center"> {p.price}</td>
                                <td className="text-center"> {p.stock}</td>
                                <td className="text-center">
                                    <Button variant="outline" className="font-secondary font-extrabold  text-slate-600 border-neutral-700/30 hover:cursor-pointer gap-2 h-6 w-13">
                                        Editar
                                    </Button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

    )
}