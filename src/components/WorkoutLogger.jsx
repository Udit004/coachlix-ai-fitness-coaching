// components/WorkoutLogger.jsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  Plus,
  Minus,
  Clock,
  CheckCircle2,
  Timer,
  Dumbbell,
  Target,
  RotateCcw,
  Save,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function WorkoutLogger({ workout, onSave, onCancel }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [exerciseData, setExerciseData] = useState({});
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const restTimerRef = useRef(null);
  const workoutTimerRef = useRef(null);
  const audioRef = useRef(null);

  const currentExercise = workout.exercises[currentExerciseIndex];
  const totalExercises = workout.exercises.length;

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/timer-end.mp3");
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Initialize exercise data
  useEffect(() => {
    const initialData = {};
    workout.exercises.forEach((exercise, exerciseIndex) => {
      initialData[exerciseIndex] = {
        sets: Array.from(
          { length: exercise.targetSets || 3 },
          (_, setIndex) => ({
            reps: "",
            weight: "",
            completed: false,
            restTime: exercise.sets?.[setIndex]?.restTime || 60,
            notes: "",
          })
        ),
        notes: "",
        isCompleted: false,
      };
    });
    setExerciseData(initialData);
  }, [workout]);

  // Workout timer
  useEffect(() => {
    if (isWorkoutActive) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(workoutTimerRef.current);
    }

    return () => clearInterval(workoutTimerRef.current);
  }, [isWorkoutActive]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restTimerRef.current = setTimeout(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimeout(restTimerRef.current);
    }

    return () => clearTimeout(restTimerRef.current);
  }, [isResting, restTimer, soundEnabled]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startWorkout = () => {
    setIsWorkoutActive(true);
  };

  const pauseWorkout = () => {
    setIsWorkoutActive(false);
  };

  const finishWorkout = () => {
    setShowSaveModal(true);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        sets: prev[exerciseIndex].sets.map((set, idx) =>
          idx === setIndex ? { ...set, [field]: value } : set
        ),
      },
    }));
  };

  const completeSet = (exerciseIndex, setIndex) => {
    const currentSet = exerciseData[exerciseIndex]?.sets[setIndex];
    if (!currentSet?.reps) return;

    updateSet(exerciseIndex, setIndex, "completed", true);

    // Start rest timer
    const restTime = currentSet.restTime || 60;
    setRestTimer(restTime);
    setIsResting(true);

    // Move to next set or exercise
    const totalSets = exerciseData[exerciseIndex].sets.length;
    if (setIndex < totalSets - 1) {
      setCurrentSetIndex(setIndex + 1);
    } else {
      // Mark exercise as complete
      setExerciseData((prev) => ({
        ...prev,
        [exerciseIndex]: {
          ...prev[exerciseIndex],
          isCompleted: true,
        },
      }));

      // Move to next exercise
      if (exerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(exerciseIndex + 1);
        setCurrentSetIndex(0);
      }
    }
  };

  const addSet = (exerciseIndex) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        sets: [
          ...prev[exerciseIndex].sets,
          {
            reps: "",
            weight: "",
            completed: false,
            restTime: 60,
            notes: "",
          },
        ],
      },
    }));
  };

  const removeSet = (exerciseIndex, setIndex) => {
    if (exerciseData[exerciseIndex].sets.length <= 1) return;

    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        sets: prev[exerciseIndex].sets.filter((_, idx) => idx !== setIndex),
      },
    }));

    if (setIndex === currentSetIndex && setIndex > 0) {
      setCurrentSetIndex(setIndex - 1);
    }
  };

  const skipRestTimer = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const resetRestTimer = () => {
    const currentSet =
      exerciseData[currentExerciseIndex]?.sets[currentSetIndex];
    const restTime = currentSet?.restTime || 60;
    setRestTimer(restTime);
    setIsResting(true);
  };

  const saveWorkout = async () => {
    const workoutData = {
      workoutId: workout._id,
      duration: workoutTimer,
      exercises: Object.entries(exerciseData).map(([exerciseIndex, data]) => ({
        exerciseId: workout.exercises[exerciseIndex]._id,
        sets: data.sets,
        notes: data.notes,
        isCompleted: data.isCompleted,
      })),
      notes: workoutNotes,
      completedAt: new Date().toISOString(),
    };

    await onSave(workoutData);
  };

  if (!currentExercise) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Workout Complete!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Great job! You've finished all exercises.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {workout.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Exercise {currentExerciseIndex + 1} of {totalExercises}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Workout Timer */}
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                {formatTime(workoutTimer)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Time
              </div>
            </div>

            {/* Controls */}
            <div className="flex space-x-2">
              <button
                onClick={
                  soundEnabled
                    ? () => setSoundEnabled(false)
                    : () => setSoundEnabled(true)
                }
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>

              {!isWorkoutActive ? (
                <button
                  onClick={startWorkout}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={pauseWorkout}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={finishWorkout}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Finish</span>
              </button>

              <button
                onClick={onCancel}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest Timer */}
      {isResting && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-orange-600 dark:text-orange-400 mb-2">
              {formatTime(restTimer)}
            </div>
            <p className="text-orange-800 dark:text-orange-300 mb-4">
              Rest time remaining
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={skipRestTimer}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Skip Rest
              </button>
              <button
                onClick={resetRestTimer}
                className="px-4 py-2 border border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/50 rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Exercise */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentExercise.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentExercise.category} •{" "}
              {currentExercise.muscleGroups?.join(", ")}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Set {currentSetIndex + 1}
              <span className="text-lg text-gray-500 dark:text-gray-400">
                /{exerciseData[currentExerciseIndex]?.sets.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Exercise Instructions */}
        {currentExercise.instructions && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              {currentExercise.instructions}
            </p>
          </div>
        )}

        {/* Sets Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Set
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Previous
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Weight
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Reps
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Rest
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {exerciseData[currentExerciseIndex]?.sets.map((set, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-100 dark:border-gray-700 ${
                    index === currentSetIndex
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {index + 1}
                      </span>
                      {set.completed && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                    {/* Previous set data would go here */}-
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) =>
                        updateSet(
                          currentExerciseIndex,
                          index,
                          "weight",
                          e.target.value
                        )
                      }
                      disabled={set.completed}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(
                          currentExerciseIndex,
                          index,
                          "reps",
                          e.target.value
                        )
                      }
                      disabled={set.completed}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      value={set.restTime}
                      onChange={(e) =>
                        updateSet(
                          currentExerciseIndex,
                          index,
                          "restTime",
                          e.target.value
                        )
                      }
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="60"
                    />
                  </td>
                  <td className="py-3 px-2">
                    {!set.completed && index === currentSetIndex && (
                      <button
                        onClick={() => completeSet(currentExerciseIndex, index)}
                        disabled={!set.reps}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Set Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => addSet(currentExerciseIndex)}
              className="inline-flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Set</span>
            </button>

            {exerciseData[currentExerciseIndex]?.sets.length > 1 && (
              <button
                onClick={() =>
                  removeSet(
                    currentExerciseIndex,
                    exerciseData[currentExerciseIndex].sets.length - 1
                  )
                }
                className="inline-flex items-center space-x-1 px-3 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:border-red-400 dark:hover:border-red-500 transition-colors"
              >
                <Minus className="h-4 w-4" />
                <span>Remove Set</span>
              </button>
            )}
          </div>

          {/* Exercise Navigation */}
          <div className="flex space-x-2">
            {currentExerciseIndex > 0 && (
              <button
                onClick={() => {
                  setCurrentExerciseIndex(currentExerciseIndex - 1);
                  setCurrentSetIndex(0);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                Previous Exercise
              </button>
            )}

            {currentExerciseIndex < totalExercises - 1 && (
              <button
                onClick={() => {
                  setCurrentExerciseIndex(currentExerciseIndex + 1);
                  setCurrentSetIndex(0);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Next Exercise
              </button>
            )}
          </div>
        </div>

        {/* Exercise Notes */}
        <div className="mt-6">
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
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Add notes about this exercise..."
          />
        </div>
      </div>

      {/* Exercise Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workout Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workout.exercises.map((exercise, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                index === currentExerciseIndex
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : exerciseData[index]?.isCompleted
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => {
                setCurrentExerciseIndex(index);
                setCurrentSetIndex(0);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {exercise.name}
                </h4>
                {exerciseData[index]?.isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400">
                {exerciseData[index]?.sets.filter((set) => set.completed)
                  .length || 0}{" "}
                / {exerciseData[index]?.sets.length || 0} sets
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    exerciseData[index]?.isCompleted
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${
                      ((exerciseData[index]?.sets.filter((set) => set.completed)
                        .length || 0) /
                        (exerciseData[index]?.sets.length || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workout Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Workout Notes
        </label>
        <textarea
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Add notes about your workout session..."
        />
      </div>

      {/* Save Workout Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Save Workout
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Duration:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(workoutTimer)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Completed Exercises:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {
                      Object.values(exerciseData).filter((ex) => ex.isCompleted)
                        .length
                    }{" "}
                    / {totalExercises}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Sets:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Object.values(exerciseData).reduce(
                      (total, ex) =>
                        total + ex.sets.filter((set) => set.completed).length,
                      0
                    )}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveWorkout}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
