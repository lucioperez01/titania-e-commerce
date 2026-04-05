

import HeroCarouselClient from "./heroCarouselClient"
import { getProducts } from "@/application/use-cases/get-products"

export default async function HeroCarousel() {
  const products = await getProducts()

  console.log("products: ", products)

  return <HeroCarouselClient products={products} />

}

