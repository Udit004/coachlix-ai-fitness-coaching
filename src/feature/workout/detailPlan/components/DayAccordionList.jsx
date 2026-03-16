"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Moon, Trash2 } from "lucide-react";
import WorkoutDetailCard from "./WorkoutDetailCard";

const getDayStatus = (day) => {
  if (day.isRestDay) return "rest";
  if (!day.workouts || day.workouts.length === 0) return "empty";
  const allCompleted = day.workouts.every((w) => w.isCompleted);
  const someCompleted = day.workouts.some((w) => w.isCompleted);
  if (allCompleted) return "completed";
  if (someCompleted) return "partial";
  return "pending";
};

const statusClassMap = {
  completed: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
  partial: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20",
  rest: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
  empty: "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30",
  pending: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
};

export default function DayAccordionList({
  weekNumber,
  days,
  onStartWorkout,
  onAddExercise,
  onDeleteDay,
  onDeleteWorkout,
  onEditExercise,
  onDeleteExercise,
  isActionPending,
}) {
  const [openDay, setOpenDay] = useState(days?.[0]?.dayNumber || 1);

  const totalWeekExercises = useMemo(() => {
    return (days || []).reduce((total, day) => {
      return (
        total +
        (day.workouts || []).reduce(
          (workoutTotal, workout) => workoutTotal + (workout.exercises?.length || 0),
          0
        )
      );
    }, 0);
  }, [days]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Week exercise volume</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalWeekExercises} exercises</p>
      </div>

      {(days || []).map((day) => {
        const status = getDayStatus(day);
        const isOpen = openDay === day.dayNumber;

        return (
          <section
            key={day.dayNumber}
            className={`rounded-2xl border p-3 sm:p-4 ${statusClassMap[status]}`}
          >
            <button
              onClick={() => setOpenDay((prev) => (prev === day.dayNumber ? null : day.dayNumber))}
              className="flex w-full items-center justify-between gap-3 cursor-pointer"
            >
              <div className="text-left">
                <p className="text-base font-semibold text-gray-900 dark:text-white">{day.dayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Day {day.dayNumber} · {(day.workouts || []).length} workouts
                </p>
              </div>
              <div className="flex items-center gap-2">
                {status === "rest" && <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {isOpen && (
              <div className="mt-3 space-y-3">
                {day.workouts?.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => onDeleteDay({ weekNumber, dayNumber: day.dayNumber, dayName: day.dayName })}
                      disabled={isActionPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear day
                    </button>
                  </div>
                )}

                {day.workouts?.length > 0 ? (
                  day.workouts.map((workout, workoutIndex) => {
                    const workoutId = workout._id || workoutIndex;
                    return (
                      <WorkoutDetailCard
                        key={`${day.dayNumber}-${workoutId}`}
                        weekNumber={weekNumber}
                        dayNumber={day.dayNumber}
                        workout={workout}
                        workoutId={workoutId}
                        workoutIndex={workoutIndex}
                        onStart={onStartWorkout}
                        onAddExercise={onAddExercise}
                        onDeleteWorkout={onDeleteWorkout}
                        onEditExercise={onEditExercise}
                        onDeleteExercise={onDeleteExercise}
                        isActionPending={isActionPending}
                      />
                    );
                  })
                ) : (
                  <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-4 text-center text-sm text-gray-600 dark:text-gray-300">
                    {day.isRestDay ? "Rest day" : "No workouts scheduled"}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
