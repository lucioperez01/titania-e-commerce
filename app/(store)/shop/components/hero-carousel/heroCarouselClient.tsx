'use client'
import React from "react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    CarouselDots,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import ProductCard from "@/components/product/product-card"
import { ProductDTO } from "@/Interfaces/dto/product.dto"




export default function HeroCarouselClient({ products }: { products: ProductDTO[] }) {
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    )

    if (products.length === 0) {
        return (
            <div className=" h-auto flex flex-col gap-3 w-full">
                <h2 className="text-2xl text-center text-white font-primary font-extralight">Encuentra tu estilo:</h2>

                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <p className="text-xl text-white font-semibold">
                        No hay productos disponibles
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className=" h-auto flex flex-col gap-3 w-full">
            <h2 className="text-2xl text-center text-white font-primary font-extralight">Encuentra tu estilo:</h2>

            <Carousel
                plugins={[plugin.current]}
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent >
                    {products.map((p) => (
                        <CarouselItem key={p.id} className="basis-auto">
                            <div className="p-1 flex items-center justify-center">
                                <ProductCard p={p} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                <CarouselPrevious className="left-2 sm:-left-12 bg-black/30 hover:bg-black/50" />
                <CarouselNext className="right-2 sm:-right-12 bg-black/30 hover:bg-black/50" />
                <CarouselDots />
            </Carousel>
        </div>
    )
}
