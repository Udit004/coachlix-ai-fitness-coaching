"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Edit,
  Calendar,
  Clock,
  Trophy,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Circle,
  Plus,
  MoreVertical,
  Dumbbell,
  Timer,
  Weight,
  RotateCcw,
} from "lucide-react";
import workoutPlanService from "../../../service/workoutPlanService";
import exerciseService from "../../../service/exerciseService";
import { useAuth } from "../../../hooks/useAuth";
import WorkoutSession from "./WorkoutSession";
import AddExerciseModal from "./AddExerciseModal";
import ProgressTracker from "./ProgressTracker";

export default function WorkoutPlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showWorkoutSession, setShowWorkoutSession] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchWorkoutPlan();
    }
  }, [id, user]);

  const fetchWorkoutPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workoutPlanService.getWorkoutPlan(id);
      setPlan(response.plan || response);
      setActiveWeek(response.plan?.currentWeek || 1);
    } catch (err) {
      console.error("Error fetching workout plan:", err);
      setError(err.message || "Failed to fetch workout plan");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async (weekNumber, dayNumber, workoutId) => {
    try {
      setActiveDay(dayNumber);
      setActiveWorkout(workoutId);
      setShowWorkoutSession(true);
      
      // Log workout start
      await workoutPlanService.startWorkoutSession(id, weekNumber, dayNumber, workoutId);
    } catch (err) {
      console.error("Error starting workout:", err);
    }
  };

  const handleCompleteWorkout = async (sessionData) => {
    try {
      await workoutPlanService.completeWorkoutSession(
        id, 
        activeWeek, 
        activeDay, 
        activeWorkout, 
        sessionData
      );
      
      // Refresh plan data
      await fetchWorkoutPlan();
      setShowWorkoutSession(false);
    } catch (err) {
      console.error("Error completing workout:", err);
    }
  };

  const handleAddExercise = async (exerciseData) => {
    try {
      await workoutPlanService.addExerciseToWorkout(
        id,
        activeWeek,
        activeDay,
        activeWorkout,
        exerciseData
      );
      
      await fetchWorkoutPlan();
      setShowAddExercise(false);
    } catch (err) {
      console.error("Error adding exercise:", err);
    }
  };

  const calculateWeekProgress = (week) => {
    if (!week?.days) return 0;
    
    const totalWorkouts = week.days.reduce((total, day) => 
      total + (day.workouts?.length || 0), 0
    );
    
    const completedWorkouts = week.days.reduce((total, day) => 
      total + (day.workouts?.filter(w => w.isCompleted).length || 0), 0
    );
    
    return totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  };

  const getDayStatus = (day) => {
    if (day.isRestDay) return 'rest';
    if (!day.workouts || day.workouts.length === 0) return 'empty';
    const allCompleted = day.workouts.every(w => w.isCompleted);
    const someCompleted = day.workouts.some(w => w.isCompleted);
    
    if (allCompleted) return 'completed';
    if (someCompleted) return 'partial';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800';
      case 'rest':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800';
      case 'empty':
        return 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      default:
        return 'bg-white text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Workout plan not found</p>
          </div>
        </div>
      </div>
    );
  }

  const currentWeek = plan.weeks?.find(w => w.weekNumber === activeWeek);
  const weekProgress = calculateWeekProgress(currentWeek);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowProgress(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => router.push(`/workout-plans/${id}/edit`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Plan Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Goal</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {plan.goal}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {plan.duration} weeks
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Frequency</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {plan.workoutFrequency}x/week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {plan.stats?.completionRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Week {activeWeek} of {plan.duration}
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

          {/* Week Selector */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {plan.weeks?.map((week) => (
              <button
                key={week.weekNumber}
                onClick={() => setActiveWeek(week.weekNumber)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeWeek === week.weekNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Week {week.weekNumber}
              </button>
            ))}
          </div>

          {/* Days Grid */}
          {currentWeek && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {currentWeek.days?.map((day) => {
                const status = getDayStatus(day);
                return (
                  <div
                    key={day.dayNumber}
                    className={`border-2 rounded-xl p-4 transition-all duration-200 ${getStatusColor(status)}`}
                  >
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-sm">
                        {day.dayName}
                      </h3>
                      <p className="text-xs opacity-75">
                        Day {day.dayNumber}
                      </p>
                    </div>

                    {day.isRestDay ? (
                      <div className="text-center py-4">
                        <RotateCcw className="h-6 w-6 mx-auto mb-2 opacity-75" />
                        <p className="text-xs">Rest Day</p>
                      </div>
                    ) : day.workouts?.length > 0 ? (
                      <div className="space-y-2">
                        {day.workouts.map((workout, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium truncate">
                                {workout.name}
                              </span>
                              {workout.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 opacity-50" />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-75">
                              <span>{workout.exercises?.length || 0} exercises</span>
                              <span>{workout.estimatedDuration}min</span>
                            </div>
                            <button
                              onClick={() => handleStartWorkout(activeWeek, day.dayNumber, workout._id || idx)}
                              className="w-full py-2 px-3 bg-white/50 hover:bg-white/75 dark:bg-gray-800/50 dark:hover:bg-gray-800/75 rounded-lg text-xs font-medium transition-colors"
                            >
                              {workout.isCompleted ? 'Review' : 'Start'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Plus className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs opacity-75">No workouts</p>
                        <button
                          onClick={() => {
                            setActiveDay(day.dayNumber);
                            setShowAddExercise(true);
                          }}
                          className="mt-2 text-xs underline hover:no-underline"
                        >
                          Add workout
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Week Details */}
        {currentWeek && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Week {activeWeek} Overview
            </h3>
            
            {currentWeek.weeklyGoal && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Goal:</strong> {currentWeek.weeklyGoal}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentWeek.totalWorkouts || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Workouts Planned
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round((currentWeek.totalDuration || 0) / 60)}h
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Duration
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {weekProgress}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showWorkoutSession && (
        <WorkoutSession
          planId={id}
          weekNumber={activeWeek}
          dayNumber={activeDay}
          workoutId={activeWorkout}
          workout={currentWeek?.days?.find(d => d.dayNumber === activeDay)?.workouts?.find(w => w._id === activeWorkout)}
          onComplete={handleCompleteWorkout}
          onClose={() => setShowWorkoutSession(false)}
        />
      )}

      {showAddExercise && (
        <AddExerciseModal
          onClose={() => setShowAddExercise(false)}
          onAdd={handleAddExercise}
        />
      )}

      {showProgress && (
        <ProgressTracker
          plan={plan}
          onClose={() => setShowProgress(false)}
        />
      )}
    </div>
  );
}