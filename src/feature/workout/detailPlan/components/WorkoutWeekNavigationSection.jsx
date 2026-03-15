import React from "react";
import DayAccordionList from "./DayAccordionList";

export default function WorkoutWeekNavigationSection({
  activeWeek,
  duration,
  weekProgress,
  weeks,
  currentWeek,
  onSelectWeek,
  onStartWorkout,
  onAddExercise,
  onDeleteDay,
  onDeleteWorkout,
  onEditExercise,
  onDeleteExercise,
  isActionPending,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Week {activeWeek} of {duration}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Progress: {weekProgress}%
          </span>
          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${weekProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {weeks?.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => onSelectWeek(week.weekNumber)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWeek === week.weekNumber
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Week {week.weekNumber}
          </button>
        ))}
      </div>

      {currentWeek && (
        <DayAccordionList
          weekNumber={activeWeek}
          days={currentWeek.days || []}
          onStartWorkout={onStartWorkout}
          onAddExercise={onAddExercise}
          onDeleteDay={onDeleteDay}
          onDeleteWorkout={onDeleteWorkout}
          onEditExercise={onEditExercise}
          onDeleteExercise={onDeleteExercise}
          isActionPending={isActionPending}
        />
      )}
    </div>
  );
}
