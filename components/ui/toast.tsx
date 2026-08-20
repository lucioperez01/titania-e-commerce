"use client"

import { useEffect, useState, useCallback } from "react"
import { createContext, useContext, ReactNode } from "react"
import { Check } from "lucide-react"
import Link from "next/link"

type Toast = {
    id: number
    message: string
    link?: { href: string; label: string }
}

type ToastContextValue = {
    showToast: (message: string, link?: { href: string; label: string }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, link?: { href: string; label: string }) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, link }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="flex items-center gap-3 bg-purple-950/95 border border-purple-500/30 rounded-lg px-4 py-3 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-auto max-w-sm"
                    >
                        <Check className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-sm text-white font-secondary">{toast.message}</span>
                        {toast.link && (
                            <Link
                                href={toast.link.href}
                                className="text-xs text-purple-300 hover:text-purple-200 underline whitespace-nowrap"
                            >
                                {toast.link.label}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error("useToast must be used within ToastProvider")
    return context
}
