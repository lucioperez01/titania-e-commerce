import Link from "next/link"
import CartIcon from "@/components/cart/cart-icon"
import SearchButton from "@/components/search/search-button"
import WishlistIcon from "@/components/wishlist/wishlist-icon"
import { auth, signOut } from "@/lib/auth"
import { getNavbarCategories } from "@/application/use-cases/get-navbar-categories"
import { User, LayoutDashboard } from "lucide-react"
import MobileMenu from "./mobile-menu"
import CategoryNav from "./category-nav"

export default async function Navbar() {
  const session = await auth()
  const categories = await getNavbarCategories(5)
  const hasCategories = categories && categories.length > 0

  return (
    <header className="sticky top-0 w-full z-20 bg-purple-900/40 backdrop-blur-md border-b border-white/10">
      <div className="w-[92%] max-w-6xl mx-auto flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="font-primary text-lg font-normal tracking-[0.15em] text-white uppercase shrink-0">
          Titania
        </Link>

        {/* Categories — desktop (only if there are categories) */}
        {hasCategories && <CategoryNav categories={categories} />}

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Shop link on right when no categories */}
          {!hasCategories && (
            <Link
              href="/shop"
              className="hidden md:flex items-center text-[11px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors font-secondary"
            >
              Shop
            </Link>
          )}

          {session?.user ? (
            <div className="hidden sm:flex items-center gap-3">
              <span className="flex items-center text-[11px] text-white/50 font-secondary max-w-[140px] truncate">
                {session.user.email}
              </span>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-wider font-secondary">Gestionar</span>
                </Link>
              )}
              <form action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}>
                <button
                  type="submit"
                  className="flex items-center text-[11px] text-white/50 hover:text-white transition-colors font-secondary uppercase tracking-wider cursor-pointer"
                >
                  Salir
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center text-white/70 hover:text-white transition-colors"
              aria-label="Iniciar sesión"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          <SearchButton />
          <WishlistIcon />
          <CartIcon />

          {/* Mobile hamburger */}
          <MobileMenu
            categories={categories ?? []}
            isAdmin={session?.user?.role === "ADMIN"}
            userEmail={session?.user?.email ?? undefined}
          />
        </div>
      </div>
    </header>
  )
}
