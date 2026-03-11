"use client";
import React from "react";
import { Trophy, TrendingUp } from "lucide-react";

/**
 * PersonalRecordsWidget - Display top personal records from workout plan
 * @param {Array} records - Array of PR objects with { exercise, weight, reps, date }
 * @param {number} limit - Maximum number of records to display (default 5)
 */
export default function PersonalRecordsWidget({ records = [], limit = 5 }) {
  const sortedRecords = [...records]
    .filter((r) => r.exercise && (r.weight || r.reps))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  if (sortedRecords.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Personal Records</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Complete workouts to set your first PR! 💪
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Personal Records</h3>
      </div>

      <div className="space-y-2">
        {sortedRecords.map((record, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {record.exercise}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(record.date)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-right flex-shrink-0">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <div className="font-bold text-sm text-gray-900 dark:text-white">
                {record.weight > 0 && `${record.weight}kg`}
                {record.weight > 0 && record.reps && " × "}
                {record.reps > 0 && `${record.reps}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
