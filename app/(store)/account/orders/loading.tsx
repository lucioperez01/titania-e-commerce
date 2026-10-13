export default function OrdersLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-40 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-white/[0.04] rounded animate-pulse" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 animate-pulse"
          >
            <div className="flex justify-between mb-5">
              <div className="space-y-2">
                <div className="h-3 w-12 bg-white/[0.08] rounded" />
                <div className="h-6 w-20 bg-white/[0.08] rounded" />
              </div>
              <div className="h-6 w-20 bg-white/[0.08] rounded-full" />
            </div>

            <div className="space-y-3 mb-5">
              <div className="h-4 w-48 bg-white/[0.05] rounded" />
              <div className="h-4 w-32 bg-white/[0.05] rounded" />
            </div>

            <div className="h-[2px] bg-white/[0.06] mb-5" />

            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="h-3 w-10 bg-white/[0.08] rounded" />
                <div className="h-7 w-24 bg-white/[0.08] rounded" />
              </div>
              <div className="h-4 w-20 bg-white/[0.08] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
