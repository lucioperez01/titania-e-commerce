import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className=" w-full flex flex-col min-h-screen items-center justify-between gap-5">
                <main className="flex-1 w-full max-w-[90%]">
                    {children}
                </main>
            </div>
        </>
    );
}