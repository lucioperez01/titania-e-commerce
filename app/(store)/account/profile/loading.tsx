export default function ProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-40 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar skeleton */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-10 w-full bg-white/[0.08] rounded-xl" />
              <div className="h-10 w-full bg-white/[0.08] rounded-xl" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-6">
          {/* Profile form skeleton */}
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 animate-pulse">
            <div className="h-6 w-48 bg-white/[0.08] rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-white/[0.06] rounded" />
                  <div className="h-11 w-full bg-white/[0.08] rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* Addresses skeleton */}
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 animate-pulse">
            <div className="h-6 w-48 bg-white/[0.08] rounded mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white/[0.04] rounded-xl p-4 space-y-3">
                  <div className="h-4 w-40 bg-white/[0.08] rounded" />
                  <div className="h-3 w-64 bg-white/[0.06] rounded" />
                  <div className="h-3 w-32 bg-white/[0.06] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
