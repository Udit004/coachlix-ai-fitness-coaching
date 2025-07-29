"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  Check,
  Plus,
  Minus,
  Timer,
  Weight,
  RotateCcw,
  Target,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
} from "lucide-react";
import workoutPlanService from "../../../service/workoutPlanService";

export default function WorkoutSession({ 
  planId, 
  weekNumber, 
  dayNumber, 
  workoutId, 
  workout, 
  onComplete, 
  onClose 
}) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [completedSets, setCompletedSets] = useState({});
  const [workoutNotes, setWorkoutNotes] = useState("");

  useEffect(() => {
    if (workout?.exercises) {
      const initialData = workout.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets?.length > 0 ? exercise.sets : Array(exercise.targetSets || 3).fill(null).map((_, idx) => ({
          reps: 0,
          weight: exercise.targetWeight || 0,
          duration: 0,
          distance: 0,
          restTime: 60,
          completed: false,
          notes: ""
        }))
      }));
      setExerciseData(initialData);
    }
  }, [workout]);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    let interval;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSetData = (exerciseIndex, setIndex, field, value) => {
    setExerciseData(prev => {
      const updated = [...prev];
      if (!updated[exerciseIndex].sets[setIndex]) {
        updated[exerciseIndex].sets[setIndex] = {
          reps: 0,
          weight: 0,
          duration: 0,
          distance: 0,
          restTime: 60,
          completed: false,
          notes: ""
        };
      }
      updated[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  };

  const completeSet = async (exerciseIndex, setIndex) => {
    const setKey = `${exerciseIndex}-${setIndex}`;
    const isCompleted = !completedSets[setKey];
    
    setCompletedSets(prev => ({
      ...prev,
      [setKey]: isCompleted
    }));

    updateSetData(exerciseIndex, setIndex, 'completed', isCompleted);

    // Log set completion
    try {
      await workoutPlanService.logExerciseSet(
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exerciseData[exerciseIndex]._id || exerciseIndex,
        exerciseData[exerciseIndex].sets[setIndex]
      );
    } catch (err) {
      console.error("Error logging set:", err);
    }

    // Start rest timer if set is completed
    if (isCompleted && exerciseData[exerciseIndex].sets[setIndex]?.restTime > 0) {
      setRestTimer(exerciseData[exerciseIndex].sets[setIndex].restTime);
      setIsResting(true);
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exerciseData.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const completeWorkout = async () => {
    setIsTimerRunning(false);
    const sessionData = {
      startTime: sessionStartTime,
      endTime: new Date(),
      duration: elapsedTime,
      exercises: exerciseData,
      notes: workoutNotes,
      caloriesBurned: Math.round(elapsedTime * 0.15), // Rough estimate
      isCompleted: true
    };

    await onComplete(sessionData);
  };

  if (!workout || !exerciseData.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <p className="text-gray-600 dark:text-gray-400">Loading workout...</p>
        </div>
      </div>
    );
  }

  const currentExercise = exerciseData[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exerciseData.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {workout.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Exercise {currentExerciseIndex + 1} of {exerciseData.length}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Workout Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Rest Timer */}
        {isResting && (
          <div className="px-6 py-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Timer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-300">
                    Rest Time
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">
                    {formatTime(restTimer)}
                  </p>
                </div>
              </div>
              <button
                onClick={skipRest}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Skip Rest
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Exercise Navigation */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={previousExercise}
              disabled={currentExerciseIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {currentExercise.name}
              </h3>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>{currentExercise.targetSets} sets</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Dumbbell className="h-4 w-4" />
                  <span>{currentExercise.targetReps} reps</span>
                </span>
              </div>
            </div>

            <button
              onClick={nextExercise}
              disabled={currentExerciseIndex === exerciseData.length - 1}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Exercise Instructions */}
          {currentExercise.instructions && (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Instructions
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {currentExercise.instructions}
              </p>
            </div>
          )}

          {/* Sets Tracking */}
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Sets & Reps
            </h4>
            
            <div className="space-y-4">
              {currentExercise.sets?.map((set, setIndex) => {
                const setKey = `${currentExerciseIndex}-${setIndex}`;
                const isCompleted = completedSets[setKey];
                
                return (
                  <div
                    key={setIndex}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Set {setIndex + 1}
                      </span>
                      <button
                        onClick={() => completeSet(currentExerciseIndex, setIndex)}
                        className={`p-2 rounded-lg transition-colors ${
                          isCompleted
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Reps */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Reps
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateSetData(currentExerciseIndex, setIndex, 'reps', Math.max(0, (set?.reps || 0) - 1))}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={set?.reps || 0}
                            onChange={(e) => updateSetData(currentExerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={() => updateSetData(currentExerciseIndex, setIndex, 'reps', (set?.reps || 0) + 1)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Weight (lbs)
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateSetData(currentExerciseIndex, setIndex, 'weight', Math.max(0, (set?.weight || 0) - 5))}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={set?.weight || 0}
                            onChange={(e) => updateSetData(currentExerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            step="0.5"
                          />
                          <button
                            onClick={() => updateSetData(currentExerciseIndex, setIndex, 'weight', (set?.weight || 0) + 5)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Duration (for timed exercises) */}
                      {currentExercise.category === 'Cardio' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Duration (sec)
                          </label>
                          <input
                            type="number"
                            value={set?.duration || 0}
                            onChange={(e) => updateSetData(currentExerciseIndex, setIndex, 'duration', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      )}

                      {/* Rest Time */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Rest (sec)
                        </label>
                        <input
                          type="number"
                          value={set?.restTime || 60}
                          onChange={(e) => updateSetData(currentExerciseIndex, setIndex, 'restTime', parseInt(e.target.value) || 60)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Set Notes */}
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Notes for this set..."
                        value={set?.notes || ''}
                        onChange={(e) => updateSetData(currentExerciseIndex, setIndex, 'notes', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workout Notes */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Workout Notes
            </h4>
            <textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="How did the workout feel? Any observations..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span>Total Time: {formatTime(elapsedTime)}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors"
            >
              Save & Exit
            </button>
            <button
              onClick={completeWorkout}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Complete Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}