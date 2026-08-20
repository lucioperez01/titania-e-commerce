import type { Metadata } from "next";
import { Manrope, Merriweather_Sans, Inter } from "next/font/google";
import { NextAuthSessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawerProvider } from "@/components/cart/cart-drawer-context";
import CartDrawer from "@/components/cart/cart-drawer";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";
import { WishlistDrawerProvider } from "@/components/wishlist/wishlist-drawer-context";
import WishlistDrawer from "@/components/wishlist/wishlist-drawer";
import { SearchProvider } from "@/components/search/search-context";
import SearchOverlay from "@/components/search/search-overlay";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const primary = Manrope({
  variable: "--font-primary",
  subsets: ["latin"],
});

const secondary = Inter({
  variable: "--font-secondary",
  subsets: ["latin"],
  weight: ['400']
});

const tertiary = Merriweather_Sans({
  variable: "--font-tertiary",
  subsets: ["latin"],
  weight: ['400']
});



export const metadata: Metadata = {
  title: {
    default: "Titania",
    template: "%s | Titania",
  },
  description: "Indumentaria y accesorios de calidad accesible",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${primary.variable} bg-linear-to-tr from-purple-500/90 to-purple-900/90 antialiased min-h-screen flex flex-col items-center justify-between ${secondary.variable} ${tertiary.variable} overflow-x-hidden`}>
          <NextAuthSessionProvider>
            <ToastProvider>
              <CartProvider>
                <CartDrawerProvider>
                  <WishlistProvider>
                    <WishlistDrawerProvider>
                      <SearchProvider>
                        {children}
                        <CartDrawer />
                        <WishlistDrawer />
                        <SearchOverlay />
                      </SearchProvider>
                    </WishlistDrawerProvider>
                  </WishlistProvider>
                </CartDrawerProvider>
              </CartProvider>
            </ToastProvider>
          </NextAuthSessionProvider>
      </body>
    </html>
  );
}
