import { X, ArrowLeft, TrendingUp } from "lucide-react";

export default function ProgressTrackerHeader({
  planName,
  onBack,
  onClose,
}) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Progress Tracker
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {planName} - Detailed Analytics
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onBack || onClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  );
}
