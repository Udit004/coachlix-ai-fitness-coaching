export default function ProfileLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#071122] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left profile card */}
          <aside className="lg:col-span-1 rounded-[28px] border border-white/10 bg-[#101a2c] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-white/10 border-4 border-white/5" />
                <div className="absolute right-1 bottom-2 h-9 w-9 rounded-full border border-white/10 bg-[#18263d]" />
              </div>

              <div className="mt-6 h-7 w-40 rounded-full bg-white/12" />
              <div className="mt-3 h-4 w-48 rounded-full bg-white/8" />
              <div className="mt-3 h-3 w-24 rounded-full bg-white/8" />

              <div className="mt-8 w-full space-y-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 rounded-full bg-blue-400/20" />
                    <div className="h-4 w-16 rounded-full bg-blue-400/20" />
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded-full bg-emerald-400/20" />
                    <div className="h-4 w-10 rounded-full bg-emerald-400/20" />
                  </div>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded-full bg-violet-400/20" />
                    <div className="h-4 w-10 rounded-full bg-violet-400/20" />
                  </div>
                </div>
              </div>

              <div className="mt-8 h-12 w-full rounded-2xl bg-linear-to-r from-blue-500/70 to-violet-500/70" />
            </div>
          </aside>

          {/* Right content */}
          <section className="lg:col-span-3 space-y-5">
            <div className="rounded-[22px] border border-white/10 bg-[#101a2c] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="flex flex-wrap gap-2 rounded-[18px] bg-white/3 p-2">
                {[
                  "Overview",
                  "Statistics",
                  "Achievements",
                  "Recent Activity",
                  "Settings",
                ].map((tab, index) => (
                  <div
                    key={tab}
                    className={`rounded-xl px-4 py-3 ${index === 0 ? "bg-blue-500/20" : "bg-transparent"}`}
                  >
                    <div className="h-4 w-24 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101a2c] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="h-8 w-44 rounded-full bg-white/12" />

              <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                {Array.from({ length: 12 }, (_, index) => (
                  <div key={index}>
                    <div className="mb-2 h-4 w-24 rounded-full bg-white/10" />
                    <div className="h-14 rounded-2xl border border-white/8 bg-[#1a263a]" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}