"use client";

import { useState } from "react";
import { MoreVertical, Play, Plus, Trash2 } from "lucide-react";
import ExerciseDetailItem from "./ExerciseDetailItem";

export default function WorkoutDetailCard({
  weekNumber,
  dayNumber,
  workout,
  workoutId,
  workoutIndex,
  onStart,
  onAddExercise,
  onDeleteWorkout,
  onEditExercise,
  onDeleteExercise,
  isActionPending,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{workout.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {workout.type} · {workout.estimatedDuration || 0} min · {workout.exercises?.length || 0} exercises
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setShowMenu(false)}
                aria-label="Close menu"
              />
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAddExercise(dayNumber, workoutId);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4" />
                  Add exercises
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteWorkout({ weekNumber, dayNumber, workoutId, workoutName: workout.name });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete workout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onStart(weekNumber, dayNumber, workoutId)}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white"
        >
          <Play className="h-3.5 w-3.5" />
          {workout.isCompleted ? "Review" : "Start workout"}
        </button>
        {(workout.exercises?.length || 0) === 0 && (
          <button
            onClick={() => onAddExercise(dayNumber, workoutId)}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add exercises
          </button>
        )}
      </div>

      {(workout.exercises?.length || 0) > 0 && (
        <div className="space-y-2">
          {workout.exercises.map((exercise, exerciseIndex) => (
            <ExerciseDetailItem
              key={`${workoutIndex}-${exerciseIndex}-${exercise.name}`}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              isExpanded={expandedExercise === exerciseIndex}
              isPending={isActionPending}
              onToggle={() =>
                setExpandedExercise((prev) => (prev === exerciseIndex ? null : exerciseIndex))
              }
              onEdit={(selectedExercise, selectedIndex) =>
                onEditExercise({
                  exercise: selectedExercise,
                  exerciseIndex: selectedIndex,
                  weekNumber,
                  dayNumber,
                  workoutId,
                })
              }
              onDelete={(selectedExercise, selectedIndex) =>
                onDeleteExercise({
                  weekNumber,
                  dayNumber,
                  workoutId,
                  workoutName: workout.name,
                  exercise: selectedExercise,
                  exerciseIndex: selectedIndex,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
