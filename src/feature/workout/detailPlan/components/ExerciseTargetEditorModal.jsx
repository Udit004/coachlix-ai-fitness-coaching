"use client";

import { useEffect, useState } from "react";
import { Dumbbell, X } from "lucide-react";

export default function ExerciseTargetEditorModal({
  isOpen,
  exercise,
  onClose,
  onSave,
  isSaving,
}) {
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState("8-12");
  const [targetWeight, setTargetWeight] = useState(0);

  useEffect(() => {
    if (!exercise) return;
    setTargetSets(exercise.targetSets || 3);
    setTargetReps(exercise.targetReps || "8-12");
    setTargetWeight(exercise.targetWeight || 0);
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      targetSets: Number(targetSets),
      targetReps,
      targetWeight: Number(targetWeight),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Exercise Targets
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {exercise.name}
          </p>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Target Sets
            </span>
            <input
              type="number"
              min="1"
              max="20"
              value={targetSets}
              onChange={(e) => setTargetSets(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Target Reps
            </span>
            <input
              type="text"
              value={targetReps}
              onChange={(e) => setTargetReps(e.target.value)}
              placeholder="e.g. 8-12"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Target Weight (kg)
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
