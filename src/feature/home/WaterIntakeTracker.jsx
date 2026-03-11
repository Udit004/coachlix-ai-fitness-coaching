"use client";
import React, { useState } from "react";
import { Droplet, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * WaterIntakeTracker - Visual water intake counter with glasses
 * @param {number} current - Current water intake in liters
 * @param {number} target - Target water intake in liters (default 3L)
 * @param {function} onChange - Callback when water intake changes
 */
export default function WaterIntakeTracker({ current = 0, target = 3, onChange }) {
  const glasses = 8; // 8 glasses visualization
  const filledGlasses = Math.min(Math.floor((current / target) * glasses), glasses);
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  const handleIncrement = () => {
    const newValue = Math.min(current + 0.25, target * 1.5); // Allow up to 150% of target
    onChange?.(parseFloat(newValue.toFixed(2)));
  };

  const handleDecrement = () => {
    const newValue = Math.max(current - 0.25, 0);
    onChange?.(parseFloat(newValue.toFixed(2)));
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Water Intake</h3>
        </div>
        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {current}L / {target}L
        </div>
      </div>

      {/* Visual glasses representation */}
      <div className="flex gap-1 mb-4 justify-center">
        {Array.from({ length: glasses }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-8 rounded-b-md border-2 transition-all duration-300 ${
              i < filledGlasses
                ? "bg-blue-400 border-blue-500 dark:bg-blue-500 dark:border-blue-400"
                : "bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecrement}
          disabled={current <= 0}
          className="h-8 w-8 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[60px] text-center">
          {percentage}% done
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleIncrement}
          className="h-8 w-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
