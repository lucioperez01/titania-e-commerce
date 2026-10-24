import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import PromoBanner from "@/components/storefront/promo-banner"
import { getActivePromotions } from "@/lib/promotions/get-active-promotions"

export default async function StoreLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Fetch active automatic promotions server-side.
    // If the query fails or there are no active promotions, the banner
    // gracefully renders nothing (no empty gap in the layout).
    const promotions = await getActivePromotions().catch(() => []);

    return (
        <div className="flex flex-col min-h-screen justify-between gap-5 w-full max-w-full">
            <PromoBanner promotions={promotions} />
            <Navbar />

            <main className="flex-1">
                {children}
            </main>

            <Footer />
        </div>
    );
}
