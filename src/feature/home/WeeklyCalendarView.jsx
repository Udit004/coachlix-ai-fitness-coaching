"use client";
import React from "react";
import { CheckCircle2, Circle, Coffee } from "lucide-react";

/**
 * WeeklyCalendarView - Mini calendar showing workout completion status for the week
 * @param {Array} weekDays - Array of day objects with dayNumber, dayName, isRestDay, workouts, isCompleted
 * @param {number} currentDayNumber - Today's day number (1-7)
 */
export default function WeeklyCalendarView({ weekDays = [], currentDayNumber = 1 }) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Map week days to calendar format
  const calendarDays = dayLabels.map((label, index) => {
    const dayNumber = index + 1;
    const dayData = weekDays.find((d) => d.dayNumber === dayNumber);
    
    const isToday = dayNumber === currentDayNumber;
    const isRestDay = dayData?.isRestDay || false;
    const hasWorkouts = (dayData?.workouts?.length || 0) > 0;
    const isCompleted = dayData?.workouts?.every((w) => w.isCompleted) || false;
    const isPast = dayNumber < currentDayNumber;

    return {
      label,
      dayNumber,
      isToday,
      isRestDay,
      hasWorkouts,
      isCompleted,
      isPast,
      workoutCount: dayData?.workouts?.length || 0,
    };
  });

  const completedWorkouts = calendarDays.filter((d) => d.isCompleted).length;
  const totalWorkoutDays = calendarDays.filter((d) => !d.isRestDay && d.hasWorkouts).length;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-purple-100 dark:border-purple-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">This Week</h3>
        <div className="text-xs font-medium text-purple-600 dark:text-purple-400">
          {completedWorkouts}/{totalWorkoutDays} workouts
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          let bgColor = "bg-white dark:bg-gray-800";
          let borderColor = "border-gray-200 dark:border-gray-700";
          let icon = null;

          if (day.isToday) {
            bgColor = "bg-purple-100 dark:bg-purple-900/50";
            borderColor = "border-purple-400 dark:border-purple-600";
          }

          if (day.isRestDay) {
            icon = <Coffee className="w-4 h-4 text-orange-400" />;
          } else if (day.isCompleted) {
            icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
          } else if (day.hasWorkouts) {
            icon = <Circle className="w-4 h-4 text-gray-400" />;
          }

          return (
            <div
              key={day.dayNumber}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${bgColor} ${borderColor} ${
                day.isToday ? "ring-2 ring-purple-300 dark:ring-purple-700" : ""
              }`}
            >
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {day.label}
              </div>
              <div className="flex items-center justify-center h-6">
                {icon}
              </div>
              {day.isToday && (
                <div className="w-1 h-1 rounded-full bg-purple-500 mt-1" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="w-3 h-3 text-gray-400" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <Coffee className="w-3 h-3 text-orange-400" />
          <span>Rest</span>
        </div>
      </div>
    </div>
  );
}
