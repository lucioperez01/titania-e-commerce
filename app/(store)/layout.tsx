import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className="flex flex-col min-h-screen items-center justify-between gap-5">
                <Navbar />

                <main className="flex-1 w-full">
                    {children}
                </main>

                <Footer />
            </div>
        </>
    );
}