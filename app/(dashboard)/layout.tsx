'use client'

import { useState } from "react"
import { Sidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { Menu } from "lucide-react"

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-neutral-950">
            <Sidebar />
            <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

            <div className="flex-1 md:ml-64">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-purple-400/20 bg-neutral-900/60 px-6 backdrop-blur-xl md:px-8">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden text-slate-300 hover:text-white transition-colors"
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex-1" />
                </header>
                <main className="p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
