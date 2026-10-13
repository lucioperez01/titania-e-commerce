import { MapPin, Phone, User } from "lucide-react"

interface ShippingAddressCardProps {
  address: {
    fullName: string
    phone: string
    line1: string
    line2?: string | null
    city: string
    province: string
    postalCode: string
    country: string
  }
}

export function ShippingAddressCard({ address }: ShippingAddressCardProps) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.10] hover:border-white/[0.15]">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.08]">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-purple-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-secondary text-white/60 uppercase tracking-wider">
          Dirección de Envío
        </h3>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-white font-medium">{address.fullName}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Phone className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <p className="text-white/80">{address.phone}</p>
        </div>

        <div className="pl-6 space-y-1 text-white/70">
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.province}
          </p>
          <p>{address.postalCode}</p>
          <p className="text-white/50">{address.country}</p>
        </div>
      </div>
    </div>
  )
}
