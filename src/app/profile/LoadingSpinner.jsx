export default function LoadingSpinner({ message = "Loading...", showSpinner = true }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {showSpinner && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}