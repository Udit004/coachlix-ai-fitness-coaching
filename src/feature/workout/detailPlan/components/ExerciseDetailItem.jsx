"use client";

import { ChevronDown, ChevronUp, Dumbbell, PenSquare, Trash2, Video } from "lucide-react";

export default function ExerciseDetailItem({
  exercise,
  exerciseIndex,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  isPending,
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">{exercise.name}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
            <span className="rounded bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5">{exercise.category}</span>
            <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5">
              {exercise.targetSets || 0} sets
            </span>
            <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5">
              {exercise.targetReps || "-"} reps
            </span>
            <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5">
              {exercise.targetWeight || 0} kg
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(exercise, exerciseIndex)}
            disabled={isPending}
            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            title="Edit targets"
          >
            <PenSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(exercise, exerciseIndex)}
            disabled={isPending}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
            title="Remove exercise"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onToggle}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Expand details"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <Dumbbell className="mt-0.5 h-4 w-4 text-gray-500" />
            <p>
              <span className="font-medium">Equipment:</span>{" "}
              {Array.isArray(exercise.equipment) && exercise.equipment.length > 0
                ? exercise.equipment.join(", ")
                : "Bodyweight"}
            </p>
          </div>

          <p>
            <span className="font-medium">Muscle groups:</span>{" "}
            {Array.isArray(exercise.muscleGroups) && exercise.muscleGroups.length > 0
              ? exercise.muscleGroups.join(", ")
              : "Full Body"}
          </p>

          {!!exercise.instructions && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-6">
              {exercise.instructions}
            </p>
          )}

          {!!exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 underline"
            >
              <Video className="h-4 w-4" />
              Watch exercise video
            </a>
          )}
        </div>
      )}
    </div>
  );
}
