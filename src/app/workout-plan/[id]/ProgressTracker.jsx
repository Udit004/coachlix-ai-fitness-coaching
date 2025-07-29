"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  TrendingUp,
  Calendar,
  Clock,
  Weight,
  Target,
  Trophy,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LineChart,
  Activity,
  Flame,
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import workoutPlanService from "../../../service/workoutPlanService";

export default function ProgressTracker({ plan, onClose }) {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    averageRating: 0,
    caloriesBurned: 0,
    strengthGains: 0,
    consistency: 0
  });

  useEffect(() => {
    if (plan?._id) {
      fetchProgressData();
    }
  }, [plan?._id]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const [progressResponse, statsResponse] = await Promise.all([
        workoutPlanService.getProgressHistory(plan._id),
        workoutPlanService.getWorkoutStats(plan._id)
      ]);

      setProgressData(progressResponse.progress || []);
      if (statsResponse.stats) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = useMemo(() => {
    const weeks = plan.weeks || [];

    weeks.forEach((week, index) => {
      const weekData = {
        week: week.weekNumber,
        workouts: 0,
        duration: 0,
        completionRate: 0,
        avgWeight: 0,
        avgReps: 0
      };

      if (week.days) {
        let totalWorkouts = 0;
        let completedWorkouts = 0;
        let totalDuration = 0;
        let totalWeight = 0;
        let totalReps = 0;
        let exerciseCount = 0;

        week.days.forEach(day => {
          if (day.workouts) {
            totalWorkouts += day.workouts.length;
            day.workouts.forEach(workout => {
              if (workout.isCompleted) {
                completedWorkouts++;
                totalDuration += workout.actualDuration || workout.estimatedDuration || 0;
              }

              if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                  if (exercise.sets) {
                    exercise.sets.forEach(set => {
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
        weekData.duration = Math.round(totalDuration / 60); // Convert to hours
        weekData.completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
        weekData.avgWeight = exerciseCount > 0 ? Math.round(totalWeight / exerciseCount) : 0;
        weekData.avgReps = exerciseCount > 0 ? Math.round(totalReps / exerciseCount) : 0;
      }

      weeklyData.push(weekData);
    });

    return weeklyData;
  }, [plan.weeks]);

  const strengthData = useMemo(() => {
    const exercises = new Map();
    plan.weeks?.forEach(week => {
      week.days?.forEach(day => {
        day.workouts?.forEach(workout => {
          workout.exercises?.forEach(exercise => {
            if (!exercises.has(exercise.name)) {
              exercises.set(exercise.name, []);
            }

            exercise.sets?.forEach(set => {
              if (set.completed && set.weight > 0) {
                exercises.get(exercise.name).push({
                  week: week.weekNumber,
                  weight: set.weight,
                  reps: set.reps || 0
                });
              }
            });
          });
        });
      });
    });

    exercises.forEach((sets, exerciseName) => {
      const weeklyMax = new Map();
      
      sets.forEach(set => {
        const currentMax = weeklyMax.get(set.week) || 0;
        if (set.weight > currentMax) {
          weeklyMax.set(set.week, set.weight);
        }
      });

      weeklyMax.forEach((weight, week) => {
        strengthData.push({
          week: `Week ${week}`,
          exercise: exerciseName,
          maxWeight: weight
        });
      });
    });

    return strengthData.slice(0, 20); // Limit to top 20 entries
  }, [plan.weeks]);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "weekly", label: "Weekly Progress", icon: LineChart },
    { id: "strength", label: "Strength Gains", icon: Weight },
    { id: "detailed", label: "Detailed Stats", icon: Activity },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading progress data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Progress Tracker
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {plan.name} - Detailed Analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {stats.totalWorkouts}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Workouts Completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {Math.round(stats.totalDuration / 60)}h
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Total Duration
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {stats.caloriesBurned || 0}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Calories Burned
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {stats.consistency || 0}%
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Consistency Rate
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Overview Chart */}
              <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Weekly Completion Rate
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "weekly" && (
            <div className="space-y-6">
              {/* Week Selector */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Weekly Progress Analysis
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                    disabled={selectedWeek <= 1}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg font-medium">
                    Week {selectedWeek}
                  </span>
                  <button
                    onClick={() => setSelectedWeek(Math.min(plan.duration || 12, selectedWeek + 1))}
                    disabled={selectedWeek >= (plan.duration || 12)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Weekly Stats Chart */}
              <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Workouts & Duration
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="workouts" fill="#3b82f6" name="Workouts Completed" />
                    <Bar dataKey="duration" fill="#10b981" name="Duration (hours)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "strength" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Strength Progression
              </h3>

              {strengthData.length > 0 ? (
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Max Weight Progress
                  </h4>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={strengthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="maxWeight" fill="#f59e0b" name="Max Weight (lbs)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Weight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No strength data available yet. Complete some workouts to see your progress!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "detailed" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detailed Statistics
              </h3>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Workout Distribution
                  </h4>
                  <div className="space-y-3">
                    {plan.weeks?.map((week, index) => (
                      <div key={week.weekNumber} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Week {week.weekNumber}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${weeklyData[index]?.completionRate || 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
                            {weeklyData[index]?.completionRate || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Performance Metrics
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Average Workout Duration
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round((stats.totalDuration / stats.totalWorkouts) || 0)} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total Sets Completed
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {progressData.reduce((total, entry) => total + (entry.setsCompleted || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total Reps Completed
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {progressData.reduce((total, entry) => total + (entry.repsCompleted || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Plan Completion
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.stats?.completionRate || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}