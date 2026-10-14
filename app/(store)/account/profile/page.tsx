import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getProfile, getAddresses } from "./actions"
import { ProfileForm } from "@/components/account/profile-form"
import { AddressList } from "@/components/account/address-list"
import { User } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mi Perfil",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [profile, addresses] = await Promise.all([getProfile(), getAddresses()])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
          <User className="w-5 h-5 text-purple-300" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-primary text-white font-semibold tracking-tight">
            Mi Perfil
          </h1>
          <p className="text-sm text-white/40 font-secondary mt-0.5">
            Gestiona tu informacion personal y direcciones
          </p>
        </div>
      </div>

      {/* Profile form */}
      <ProfileForm profile={profile} />

      {/* Addresses section */}
      <AddressList addresses={addresses} />
    </div>
  )
}
