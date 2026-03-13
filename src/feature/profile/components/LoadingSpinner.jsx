export default function LoadingSpinner({ message = "Loading...", showSpinner = true }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center">
        {showSpinner && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        <p className="text-gray-600 dark:text-slate-300">{message}</p>
      </div>
    </div>
  );
}
