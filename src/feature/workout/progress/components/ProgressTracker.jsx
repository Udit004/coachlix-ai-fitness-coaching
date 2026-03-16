"use client";
import React, { useMemo, useState } from "react";
import {
  Weight,
  BarChart3,
  LineChart,
  Activity,
} from "lucide-react";
import {
  useWorkoutProgressHistory,
  useWorkoutProgressStats,
} from "../hooks/useWorkoutProgressQueries";
import ProgressTrackerHeader from "./ProgressTrackerHeader";
import ProgressTrackerTabs from "./ProgressTrackerTabs";
import ProgressTrackerPanels from "./ProgressTrackerPanels";

export default function ProgressTracker({
  plan,
  onClose,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedWeek, setSelectedWeek] = useState(1);

  const { data: progressResponse, isLoading: progressLoading } =
    useWorkoutProgressHistory(plan?._id);
  const { data: statsResponse, isLoading: statsLoading } =
    useWorkoutProgressStats(plan?._id);

  const loading = progressLoading || statsLoading;
  const progressData = progressResponse?.progress || [];
  const stats =
    statsResponse?.stats || {
      totalWorkouts: 0,
      totalDuration: 0,
      averageRating: 0,
      caloriesBurned: 0,
      strengthGains: 0,
      consistency: 0,
    };

  const weeklyData = useMemo(() => {
    const weeks = plan?.weeks || [];
    const calculatedWeeklyData = [];

    weeks.forEach((week) => {
      const weekData = {
        week: week.weekNumber,
        workouts: 0,
        duration: 0,
        completionRate: 0,
        avgWeight: 0,
        avgReps: 0,
      };

      if (week.days) {
        let totalWorkouts = 0;
        let completedWorkouts = 0;
        let totalDuration = 0;
        let totalWeight = 0;
        let totalReps = 0;
        let exerciseCount = 0;

        week.days.forEach((day) => {
          if (day.workouts) {
            totalWorkouts += day.workouts.length;
            day.workouts.forEach((workout) => {
              if (workout.isCompleted) {
                completedWorkouts++;
                totalDuration += workout.actualDuration || workout.estimatedDuration || 0;
              }

              if (workout.exercises) {
                workout.exercises.forEach((exercise) => {
                  if (exercise.sets) {
                    exercise.sets.forEach((set) => {
                      if (set.completed) {
                        totalWeight += set.weight || 0;
                        totalReps += set.reps || 0;
                        exerciseCount++;
                      }
                    });
                  }
                });
              }
            });
          }
        });

        weekData.workouts = completedWorkouts;
        weekData.duration = Math.round(totalDuration / 60);
        weekData.completionRate =
          totalWorkouts > 0
            ? Math.round((completedWorkouts / totalWorkouts) * 100)
            : 0;
        weekData.avgWeight = exerciseCount > 0 ? Math.round(totalWeight / exerciseCount) : 0;
        weekData.avgReps = exerciseCount > 0 ? Math.round(totalReps / exerciseCount) : 0;
      }

      calculatedWeeklyData.push(weekData);
    });

    return calculatedWeeklyData;
  }, [plan?.weeks]);

  const strengthData = useMemo(() => {
    const exercises = new Map();
    const calculatedStrengthData = [];

    plan?.weeks?.forEach((week) => {
      week.days?.forEach((day) => {
        day.workouts?.forEach((workout) => {
          workout.exercises?.forEach((exercise) => {
            if (!exercises.has(exercise.name)) {
              exercises.set(exercise.name, []);
            }

            exercise.sets?.forEach((set) => {
              if (set.completed && set.weight > 0) {
                exercises.get(exercise.name).push({
                  week: week.weekNumber,
                  weight: set.weight,
                  reps: set.reps || 0,
                });
              }
            });
          });
        });
      });
    });

    exercises.forEach((sets, exerciseName) => {
      const weeklyMax = new Map();

      sets.forEach((set) => {
        const currentMax = weeklyMax.get(set.week) || 0;
        if (set.weight > currentMax) {
          weeklyMax.set(set.week, set.weight);
        }
      });

      weeklyMax.forEach((weight, week) => {
        calculatedStrengthData.push({
          week: `Week ${week}`,
          exercise: exerciseName,
          maxWeight: weight,
        });
      });
    });

    return calculatedStrengthData.slice(0, 20);
  }, [plan?.weeks]);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "weekly", label: "Weekly Progress", icon: LineChart },
    { id: "strength", label: "Strength Gains", icon: Weight },
    { id: "detailed", label: "Detailed Stats", icon: Activity },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 pt-2 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl mx-auto p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading progress data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 pt-2 pb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl mx-auto flex flex-col">
        <ProgressTrackerHeader
          planName={plan?.name}
          onBack={onBack}
          onClose={onClose}
        />

        <ProgressTrackerTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <ProgressTrackerPanels
          activeTab={activeTab}
          weeklyData={weeklyData}
          strengthData={strengthData}
          stats={stats}
          progressData={progressData}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          plan={plan}
        />
      </div>
    </div>
  );
}
