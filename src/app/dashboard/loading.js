export default function DashboardLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1220] px-4 py-8 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-24 rounded-full bg-indigo-500/30" />
            <div className="h-10 w-72 max-w-[70vw] rounded-2xl bg-indigo-500/20" />
          </div>
          <div className="h-11 w-36 rounded-xl bg-linear-to-r from-indigo-600/80 to-purple-600/80 border border-white/10" />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-red-600/40 bg-linear-to-br from-red-950/30 to-[#111827] p-5 shadow-[0_0_0_1px_rgba(248,113,113,0.08)]">
            <div className="h-4 w-36 rounded-full bg-red-400/20" />
            <div className="mt-5 h-12 w-16 rounded-xl bg-red-400/25" />
            <div className="mt-3 h-4 w-28 rounded-full bg-white/10" />
          </div>

          <div className="rounded-2xl border border-emerald-600/40 bg-linear-to-br from-emerald-950/30 to-[#111827] p-5 shadow-[0_0_0_1px_rgba(52,211,153,0.08)]">
            <div className="h-4 w-36 rounded-full bg-emerald-400/20" />
            <div className="mt-5 h-12 w-16 rounded-xl bg-emerald-400/25" />
            <div className="mt-3 h-4 w-28 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="min-h-112 rounded-2xl border border-white/20 bg-[#10182a] p-6 lg:col-span-2">
            <div className="h-5 w-40 rounded-full bg-white/20" />
            <div className="mt-6 h-4 w-48 rounded-full bg-white/10" />
            <div className="mt-4 h-8 w-64 rounded-full bg-white/15" />
            <div className="mt-10 h-4 w-32 rounded-full bg-white/10" />
            <div className="mt-6 h-64 rounded-3xl border border-white/10 bg-white/5" />
          </div>

          <div className="space-y-6 rounded-2xl border border-white/20 bg-[#10182a] p-6">
            <div>
              <div className="h-5 w-44 rounded-full bg-white/20" />
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="h-3 w-10 rounded-full bg-white/15" />
                  <div className="mt-3 h-7 w-8 rounded-full bg-white/20" />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="h-3 w-10 rounded-full bg-white/15" />
                  <div className="mt-3 h-7 w-8 rounded-full bg-white/20" />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="h-3 w-10 rounded-full bg-white/15" />
                  <div className="mt-3 h-7 w-12 rounded-full bg-white/20" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-5">
              <div className="h-4 w-40 rounded-full bg-orange-400/20" />
              <div className="mt-6 h-4 w-full rounded-full bg-white/10" />
              <div className="mt-3 h-4 w-4/5 rounded-full bg-white/10" />
            </div>

            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded-full bg-violet-400/20" />
                <div className="h-4 w-16 rounded-full bg-violet-400/20" />
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, index) => (
                  <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="h-3 w-6 rounded-full bg-white/15 mx-auto" />
                    <div className="mt-4 h-6 w-6 rounded-full bg-white/20 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}