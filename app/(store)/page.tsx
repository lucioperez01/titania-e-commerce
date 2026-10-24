import Link from "next/link";
import Header from "@/components/layout/header";
import HeroCarousel from "./shop/components/hero-carousel/heroCarousel";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/application/use-cases/get-products";
import { Suspense } from "react";
import HomeSkeleton from "@/components/skeletons/home-skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio",
};

async function HomeContent() {
    const products = await getProducts({ onlyOnline: true })
    return (
        <>
            <Header />
            <div className="w-90 xl:w-200">
                <HeroCarousel products={products} />
                <Link href="/shop" className="flex flex-col items-center py-5">
                    <Button variant="ghost" className="text-white cursor-pointer border rounded-xs font-primary xl:text-lg">
                        • Ver catálogo completo
                    </Button>
                </Link>
            </div>
        </>
    )
}

export default function Home() {
    return (
        <div className="flex flex-col gap-10">
            <Suspense fallback={<HomeSkeleton />}>
                <HomeContent />
            </Suspense>
        </div>
    );
}