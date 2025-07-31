"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Timer,
  Dumbbell,
  CheckCircle,
  Circle,
  Plus,
  Minus,
  RotateCcw,
  Volume2,
  VolumeX,
  Save,
  Edit3,
  Target,
} from "lucide-react";
import workoutPlanService from "../../../../service/workoutPlanService";
import AddExerciseModal from "../AddExerciseModal";
import { useAuth } from "../../../../hooks/useAuth";

export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL parameters
  const planId = params.id;
  const weekNumber = parseInt(searchParams.get("week")) || 1;
  const dayNumber = parseInt(searchParams.get("day")) || 1;
  const workoutId = searchParams.get("workout");

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutData, setWorkoutData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [exerciseData, setExerciseData] = useState({});
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [notes, setNotes] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  const timerRef = useRef(null);
  const exerciseTimerRef = useRef(null);
  const restTimerRef = useRef(null);

  // Load workout data
  useEffect(() => {
    if (planId && user) {
      fetchWorkoutData();
    }
  }, [planId, user, weekNumber, dayNumber, workoutId]);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      const response = await workoutPlanService.getWorkoutPlan(planId);
      const plan = response.plan || response;
      setPlanData(plan);

      // Find the specific workout
      const week = plan.weeks?.find((w) => w.weekNumber === weekNumber);
      const day = week?.days?.find((d) => d.dayNumber === dayNumber);
      const workout = day?.workouts?.find(
        (w, index) =>
          w._id === workoutId ||
          w.id === workoutId ||
          index.toString() === workoutId ||
          index === parseInt(workoutId)
      );

      if (!workout) {
        throw new Error("Workout not found");
      }

      setWorkoutData(workout);

      // Initialize exercise data
      if (workout.exercises && workout.exercises.length > 0) {
        const initialData = {};
        workout.exercises.forEach((exercise, index) => {
          initialData[index] = {
            completed: exercise.isCompleted || false,
            sets: exercise.completedSets || [],
            notes: exercise.notes || "",
          };
        });
        setExerciseData(initialData);

        // Set completed exercises
        const completed = workout.exercises
          .map((ex, idx) => (ex.isCompleted ? idx : null))
          .filter((idx) => idx !== null);
        setCompletedExercises(completed);
      }
    } catch (error) {
      console.error("Error fetching workout data:", error);
      alert("Failed to load workout data. Redirecting back...");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Timer effects
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

      exerciseTimerRef.current = setInterval(() => {
        setExerciseTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(exerciseTimerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(exerciseTimerRef.current);
    };
  }, [isPlaying]);

  // Rest timer effect
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }

    return () => clearInterval(restTimerRef.current);
  }, [isResting, restTimer]);

  const playSound = () => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.log("Audio not supported");
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < (workoutData?.exercises?.length || 0) - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setExerciseTimer(0);
      setCurrentSet(1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setExerciseTimer(0);
      setCurrentSet(1);
    }
  };

  const handleCompleteExercise = () => {
    const exerciseIndex = currentExerciseIndex;
    setCompletedExercises((prev) => [...prev, exerciseIndex]);

    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        completed: true,
      },
    }));

    // Start rest timer if not last exercise
    if (currentExerciseIndex < (workoutData?.exercises?.length || 0) - 1) {
      const currentExercise = workoutData?.exercises?.[currentExerciseIndex];
      const restTime = currentExercise?.restTime || 60;
      setRestTimer(restTime);
      setIsResting(true);
      handleNextExercise();
    }
  };

  const handleSetComplete = (reps, weight = null) => {
    const exerciseIndex = currentExerciseIndex;
    const setData = {
      set: currentSet,
      reps: reps,
      weight: weight,
      timestamp: new Date().toISOString(),
    };

    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        sets: [...(prev[exerciseIndex]?.sets || []), setData],
      },
    }));

    setCurrentSet((prev) => prev + 1);
  };

  const handleSaveProgress = async () => {
    try {
      setSaving(true);

      // Save individual exercise progress
      for (const [index, data] of Object.entries(exerciseData)) {
        if (data.sets.length > 0 || data.completed || data.notes) {
          await workoutPlanService.updateExercise(
            planId,
            weekNumber,
            dayNumber,
            workoutId,
            workoutData.exercises[index]._id || index,
            {
              completedSets: data.sets,
              isCompleted: data.completed,
              notes: data.notes,
            }
          );
        }
      }

      alert("Progress saved successfully!");
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Failed to save progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      setSaving(true);

      const sessionData = {
        duration: Math.floor(timer / 60),
        totalExercises: workoutData?.exercises?.length || 0,
        completedExercises: completedExercises.length,
        totalSets: Object.values(exerciseData).reduce(
          (total, ex) => total + (ex.sets?.length || 0),
          0
        ),
        exercises: Object.keys(exerciseData).map((index) => ({
          exerciseIndex: parseInt(index),
          completed: exerciseData[index].completed,
          actualSets: exerciseData[index].sets,
          notes: exerciseData[index].notes,
        })),
        notes: notes,
        averageIntensity: workoutData?.intensity || "Moderate",
      };

      await workoutPlanService.completeWorkoutSession(
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        sessionData
      );

      alert("Workout completed successfully!");
      router.push(`/workout-plan/${planId}`);
    } catch (error) {
      console.error("Error completing workout:", error);
      alert("Failed to complete workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExercise = () => {
    setShowAddExerciseModal(true);
  };

  const handleAddExercisesFromModal = async (selectedExercises) => {
    try {
      setSaving(true);

      // Add each exercise to the workout
      for (const exercise of selectedExercises) {
        await workoutPlanService.addExerciseToWorkout(
          planId,
          weekNumber,
          dayNumber,
          workoutId,
          exercise
        );
      }

      // Refresh workout data to show new exercises
      await fetchWorkoutData();
      setShowAddExerciseModal(false);

      // Show success message
      const exerciseCount = selectedExercises.length;
      alert(
        `${exerciseCount} exercise${
          exerciseCount !== 1 ? "s" : ""
        } added successfully!`
      );
    } catch (error) {
      console.error("Error adding exercises:", error);
      alert("Failed to add exercises. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const currentExercise = workoutData?.exercises?.[currentExerciseIndex];
  const exercises = workoutData?.exercises || [];
  const progressPercentage =
    exercises.length > 0
      ? (completedExercises.length / exercises.length) * 100
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading workout session...
          </p>
        </div>
      </div>
    );
  }

  if (!workoutData || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/workout-plan/${planId}`)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {workoutData?.name || "Workout Session"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Week {weekNumber}, Day {dayNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No Exercises Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              This workout doesn't have any exercises yet. Add some exercises to
              get started with your training session!
            </p>
            <button
              onClick={handleAddExercise}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Exercises</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/workout-plan/${planId}`)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {workoutData?.name || "Workout Session"}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {planData?.name} • Week {weekNumber}, Day {dayNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={handleSaveProgress}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Progress"}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress: {completedExercises.length} of {exercises.length}{" "}
                exercises
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Total Time
                  </span>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(timer)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Exercise Time
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatTime(exerciseTimer)}
                </p>
              </div>
            </div>

            {/* Rest Timer */}
            {isResting && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl text-center">
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-2">
                  Rest Time
                </h3>
                <p className="text-4xl font-bold text-orange-900 dark:text-orange-100 mb-4">
                  {formatTime(restTimer)}
                </p>
                <button
                  onClick={() => setIsResting(false)}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Skip Rest
                </button>
              </div>
            )}

            {/* Current Exercise */}
            {currentExercise && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentExercise.name}
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                  </span>
                </div>

                {currentExercise.instructions && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {currentExercise.instructions}
                  </p>
                )}

                {/* Exercise Details */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Target Sets
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {currentExercise.targetSets || 3}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Target Reps
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {currentExercise.targetReps || "8-12"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      Weight
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {currentExercise.targetWeight
                        ? `${currentExercise.targetWeight}kg`
                        : "Body weight"}
                    </p>
                  </div>
                </div>

                {/* Set Tracking */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Current Set: {currentSet}
                  </h4>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      placeholder="Reps"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id={`reps-${currentExerciseIndex}`}
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Weight (kg)"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id={`weight-${currentExerciseIndex}`}
                    />
                    <button
                      onClick={() => {
                        const reps = document.getElementById(
                          `reps-${currentExerciseIndex}`
                        ).value;
                        const weight = document.getElementById(
                          `weight-${currentExerciseIndex}`
                        ).value;
                        if (reps) {
                          handleSetComplete(
                            parseInt(reps) || 0,
                            parseFloat(weight) || null
                          );
                          document.getElementById(
                            `reps-${currentExerciseIndex}`
                          ).value = "";
                          document.getElementById(
                            `weight-${currentExerciseIndex}`
                          ).value = "";
                        }
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Complete Set
                    </button>
                  </div>
                </div>

                {/* Completed Sets */}
                {exerciseData[currentExerciseIndex]?.sets?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Completed Sets:
                    </h4>
                    <div className="space-y-2">
                      {exerciseData[currentExerciseIndex].sets.map(
                        (set, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg"
                          >
                            <span className="font-medium">Set {set.set}</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {set.reps} reps{" "}
                              {set.weight ? `@ ${set.weight}kg` : ""}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Exercise Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exercise Notes
                  </label>
                  <textarea
                    value={exerciseData[currentExerciseIndex]?.notes || ""}
                    onChange={(e) =>
                      setExerciseData((prev) => ({
                        ...prev,
                        [currentExerciseIndex]: {
                          ...prev[currentExerciseIndex],
                          notes: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add notes about this exercise..."
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-3">
                  <button
                    onClick={handlePreviousExercise}
                    disabled={currentExerciseIndex === 0}
                    className="flex items-center space-x-2 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
                  >
                    <SkipBack className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleStartPause}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                    <span>{isPlaying ? "Pause" : "Start"}</span>
                  </button>

                  <button
                    onClick={handleNextExercise}
                    disabled={currentExerciseIndex === exercises.length - 1}
                    className="flex items-center space-x-2 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
                  >
                    <span>Next</span>
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCompleteExercise}
                    disabled={completedExercises.includes(currentExerciseIndex)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Complete Exercise
                  </button>

                  <button
                    onClick={handleCompleteWorkout}
                    disabled={saving}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-medium"
                  >
                    {saving ? "Finishing..." : "Finish Workout"}
                  </button>
                </div>
              </div>

              {/* Workout Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How did this workout feel? Any observations..."
                />
              </div>
            </div>
          </div>

          {/* Exercise List Sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Exercise List
              </h3>
              <button
                onClick={handleAddExercise}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Add Exercise"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    index === currentExerciseIndex
                      ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600"
                      : completedExercises.includes(index)
                      ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                      : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setCurrentExerciseIndex(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {exercise.name}
                    </span>
                    {completedExercises.includes(index) ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : index === currentExerciseIndex ? (
                      <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      {exercise.targetSets || 3} sets ×{" "}
                      {exercise.targetReps || "8-12"} reps
                    </p>
                    {exerciseData[index]?.sets?.length > 0 && (
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {exerciseData[index].sets.length} sets completed
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showAddExerciseModal && (
        <AddExerciseModal
          onClose={() => setShowAddExerciseModal(false)}
          onAdd={handleAddExercisesFromModal}
        />
      )}
    </div>
  );
}
