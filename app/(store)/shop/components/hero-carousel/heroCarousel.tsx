

import HeroCarouselClient from "./heroCarouselClient"
import { ProductDTO } from "@/Interfaces/dto/product.dto"

export default function HeroCarousel({ products }: { products: ProductDTO[] }) {
  return <HeroCarouselClient products={products} />
}

