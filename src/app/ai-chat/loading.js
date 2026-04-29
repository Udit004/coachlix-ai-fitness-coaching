export default function AIChatLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1220] text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-400 animate-pulse px-3 py-3 sm:px-4 sm:py-4 lg:px-4 lg:py-4">
        {/* Mobile-like sidebar / desktop left rail */}
        <aside className="hidden w-80 shrink-0 lg:flex lg:flex-col lg:gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#121a2a] p-3">
            <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
              <div className="flex-1 px-4 py-3">
                <div className="h-4 w-24 rounded-full bg-blue-400/20" />
              </div>
              <div className="flex-1 px-4 py-3">
                <div className="h-4 w-16 rounded-full bg-white/10" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121a2a] p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500/25" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-white/15" />
                <div className="h-3 w-56 rounded-full bg-blue-400/15" />
                <div className="h-3 w-44 rounded-full bg-blue-400/15" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121a2a] p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded-full bg-white/15" />
              <div className="h-4 w-16 rounded-full bg-violet-400/20" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121a2a] p-4">
            <div className="h-5 w-28 rounded-full bg-white/15" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="h-4 w-4 rounded-full bg-white/15" />
                  <div className="h-4 flex-1 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121a2a] p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded-full bg-white/15" />
              <div className="h-3 w-16 rounded-full bg-violet-400/20" />
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center">
                  <div className="mx-auto h-3 w-7 rounded-full bg-white/10" />
                  <div className="mx-auto mt-4 h-5 w-5 rounded-full bg-white/15" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-[#121a2a] p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 rounded-full bg-white/15" />
              <div className="h-4 w-4 rounded-full bg-white/10" />
            </div>
          </div>
        </aside>

        {/* Main chat panel */}
        <main className="flex min-w-0 flex-1 flex-col rounded-3xl border border-white/10 bg-[#121a2a] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-white/15" />
              <div className="h-10 w-44 rounded-xl border border-white/10 bg-white/5" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-10 w-20 rounded-xl bg-violet-500/30" />
              <div className="hidden sm:block h-4 w-16 rounded-full bg-violet-400/20" />
            </div>
          </div>

          <div className="flex-1 min-h-0 px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex h-full min-h-112 items-center justify-center rounded-3xl border border-white/5 bg-[#0f1726]">
              <div className="w-full max-w-3xl px-4 sm:px-6">
                <div className="mx-auto mb-8 h-3 w-24 rounded-full bg-violet-400/20" />
                <div className="mx-auto h-24 w-24 rounded-3xl bg-linear-to-br from-blue-500/30 to-violet-500/30 border border-white/10" />
                <div className="mx-auto mt-6 h-6 w-48 rounded-full bg-white/12" />
                <div className="mx-auto mt-3 h-4 w-full max-w-xl rounded-full bg-white/8" />
                <div className="mx-auto mt-2 h-4 w-2/3 rounded-full bg-white/8" />

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="h-4 w-24 rounded-full bg-white/12" />
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-white/15" />
                    <div className="h-4 flex-1 rounded-full bg-white/10" />
                    <div className="h-5 w-5 rounded-full bg-white/15" />
                    <div className="h-5 w-5 rounded-full bg-white/15" />
                    <div className="h-5 w-12 rounded-full bg-white/15" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}