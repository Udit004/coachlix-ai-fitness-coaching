export default function RouteTransitionShell({
  title = "Loading page",
  subtitle = "Preparing your workspace...",
  cardCount = 6,
  dark = false,
}) {
  const wrapperClassName = dark
    ? "min-h-[calc(100vh-4rem)] bg-slate-950 text-white"
    : "min-h-[calc(100vh-4rem)] bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white";

  const cardClassName = dark
    ? "bg-white/5 border border-white/10"
    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm";

  return (
    <div className={`${wrapperClassName} px-4 py-6 sm:px-6 lg:px-8`} aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 max-w-3xl">
          <div className="h-3 w-28 rounded-full bg-blue-500/20" />
          <div className="mt-4 h-10 w-full max-w-xl rounded-2xl bg-gray-300/80 dark:bg-gray-700/80" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-gray-300/60 dark:bg-gray-700/60" />
          <div className="mt-2 h-4 w-3/5 rounded-full bg-gray-300/50 dark:bg-gray-700/50" />
          <div className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cardCount }, (_, index) => (
            <div key={index} className={`${cardClassName} rounded-2xl p-5`}>
              <div className="h-5 w-2/3 rounded-full bg-gray-300/80 dark:bg-gray-700/80" />
              <div className="mt-4 h-3 w-full rounded-full bg-gray-300/60 dark:bg-gray-700/60" />
              <div className="mt-2 h-3 w-5/6 rounded-full bg-gray-300/50 dark:bg-gray-700/50" />
              <div className="mt-6 h-24 rounded-xl bg-gray-300/40 dark:bg-gray-700/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}