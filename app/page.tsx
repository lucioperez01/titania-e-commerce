import Link from "next/link";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar"
import Header from "@/components/layout/header";
import HeroCarousel from "./(store)/shop/components/hero-carousel/heroCarousel";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/application/use-cases/get-products";
import { Suspense } from "react";
import HomeSkeleton from "@/components/skeletons/home-skeleton";

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
        <div className="flex flex-col min-h-screen items-center ">
            <Navbar />
            <div className="flex flex-col gap-10">
                <main className="flex-1 flex flex-col w-full justify-center items-center gap-5">
                    <Suspense fallback={<HomeSkeleton />}>
                        <HomeContent />
                    </Suspense>
                </main>
                <Footer />
            </div>
        </div>
    );
}
