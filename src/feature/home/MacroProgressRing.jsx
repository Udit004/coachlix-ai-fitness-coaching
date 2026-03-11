"use client";
import React from "react";

/**
 * MacroProgressRing - Circular progress indicator for macro nutrients
 * @param {string} label - Nutrient name (e.g., "Calories", "Protein")
 * @param {number} current - Current value consumed
 * @param {number} target - Target value
 * @param {string} unit - Unit of measurement (e.g., "kcal", "g")
 * @param {string} color - Tailwind color class for the ring
 */
export default function MacroProgressRing({ label, current = 0, target = 1, unit = "", color = "blue" }) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color mapping for stroke classes
  const colorMap = {
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    orange: "stroke-orange-500",
    purple: "stroke-purple-500",
    red: "stroke-red-500",
    yellow: "stroke-yellow-500",
  };

  const strokeColor = colorMap[color] || colorMap.blue;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className={`${strokeColor} transition-all duration-500 ease-out`}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{percentage}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{current}/{target}</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
        {unit && <div className="text-xs text-gray-500 dark:text-gray-400">{unit}</div>}
      </div>
    </div>
  );
}
