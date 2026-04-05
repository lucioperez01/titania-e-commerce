import Price from "@/components/product/price";
import Link from "next/link"
import { ProductImageDTO } from "@/Interfaces/dto/product.dto";

type ProductCardProps = {
    p: {
        id: number;
        images: ProductImageDTO[];
        slug: string;
        name: string;
        price: number;
        desc?: string;
        oldPrice?: number
    }
}

export default function ProductCard({ p }: ProductCardProps) {

    if (p.id === null) {
        return (
            <div className="animate-pulse border rounded p-3">
                <div className="w-full h-48 bg-gray-700 rounded mb-3" />
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
            </div>
        )
    }
    return (
        <Link href={`/product/${p.slug}`}>
            <div key={p.id} className="flex flex-col justify-between w-sm h-95 border border-gray-100/80 shadow-xl">


                <img src={p.images[0].url} alt={p.name} className="object-cover object-top w-sm h-70" />

                <div className="w-sm flex justify-between items-center text-white p-5">

                    <div className="flex flex-col justify-center">
                        <p className="text-xl truncate w-50">{p.name}</p>
                        <p className="text-xs text-gray-200/50 truncate w-50">{p.desc}</p>
                    </div>

                    <div>
                        <Price value={p.price} oldValue={p.oldPrice} sm={true} />
                    </div>
                </div>

            </div>
        </Link>
    )
}