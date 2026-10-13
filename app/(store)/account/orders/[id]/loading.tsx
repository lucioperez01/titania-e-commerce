export default function OrderDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      <div className="h-4 w-40 bg-white/[0.06] rounded animate-pulse mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 sm:p-8 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="space-y-2">
                <div className="h-3 w-12 bg-white/[0.08] rounded" />
                <div className="h-10 w-32 bg-white/[0.08] rounded" />
              </div>
              <div className="space-y-3 sm:items-end">
                <div className="h-8 w-28 bg-white/[0.08] rounded-full" />
                <div className="h-4 w-32 bg-white/[0.06] rounded" />
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/[0.08]" />
                    <div className="h-3 w-12 bg-white/[0.06] rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.08]">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08]" />
              <div className="h-4 w-40 bg-white/[0.08] rounded" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white/[0.08]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-white/[0.08] rounded" />
                    <div className="h-4 w-1/2 bg-white/[0.06] rounded" />
                    <div className="h-4 w-1/4 bg-white/[0.06] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.08]">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08]" />
              <div className="h-4 w-32 bg-white/[0.08] rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-white/[0.06] rounded" />
              <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
              <div className="h-4 w-1/2 bg-white/[0.06] rounded" />
            </div>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.08]">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08]" />
              <div className="h-4 w-32 bg-white/[0.08] rounded" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-white/[0.06] rounded" />
                <div className="h-4 w-16 bg-white/[0.06] rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-white/[0.06] rounded" />
                <div className="h-4 w-16 bg-white/[0.06] rounded" />
              </div>
              <div className="pt-3 mt-3 border-t border-white/[0.08] flex justify-between">
                <div className="h-5 w-16 bg-white/[0.08] rounded" />
                <div className="h-7 w-24 bg-white/[0.08] rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
