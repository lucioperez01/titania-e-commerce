import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
type ProductImageCarouselProps = {
    img: string[]
}


export default function ProductImageCarousel({ img }: ProductImageCarouselProps) {
    return (
        <Carousel

            opts={{
                align: "start",
                loop: true,
            }}
            className=" w-full h-full items-center justify-center flex"
        >
            <CarouselContent className="">
                {img.map((src, idx) => (
                    <CarouselItem key={idx} className="flex items-center justify-center">
                        <div className=" flex items-center justify-center lg:max-w-120 max-h-117">
                            <img src={src} alt={`product-${idx}`} className="w-55 lg:h-full lg:w-100 lg:object-top  rounded-xs lg:mb-" />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>

            <CarouselPrevious className="translate-x-15" />
            <CarouselNext className="-translate-x-15 " />
        </Carousel>
    )
}
