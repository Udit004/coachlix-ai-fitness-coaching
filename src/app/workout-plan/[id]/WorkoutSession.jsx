import React, { useState, useEffect, useRef } from 'react';
import {
  X,
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
  VolumeX
} from 'lucide-react';
import workoutPlanService from '../../../service/workoutPlanService';

export default function WorkoutSession({
  planId,
  weekNumber,
  dayNumber,
  workoutId,
  workout,
  onComplete,
  onClose
}) {
  const [loading, setLoading] = useState(false);
  const [workoutData, setWorkoutData] = useState(workout || null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [exerciseData, setExerciseData] = useState({});
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [notes, setNotes] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const timerRef = useRef(null);
  const exerciseTimerRef = useRef(null);
  const restTimerRef = useRef(null);

  // Debug logs
  useEffect(() => {
    console.log('WorkoutSession mounted with:', {
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      hasWorkout: !!workout,
      workoutName: workout?.name,
      exercisesCount: workout?.exercises?.length || 0
    });
  }, []);

  // Initialize workout data
  useEffect(() => {
    if (workout) {
      console.log('Setting workout data from props:', workout);
      setWorkoutData(workout);
      setLoading(false);
      
      // Initialize exercise data
      if (workout.exercises && workout.exercises.length > 0) {
        const initialData = {};
        workout.exercises.forEach((exercise, index) => {
          initialData[index] = {
            completed: false,
            sets: exercise.sets || [],
            notes: ''
          };
        });
        setExerciseData(initialData);
      }
    }
  }, [workout]);

  // Timer effects
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      
      exerciseTimerRef.current = setInterval(() => {
        setExerciseTimer(prev => prev + 1);
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
        setRestTimer(prev => {
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
      // Simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < (workoutData?.exercises?.length || 0) - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setExerciseTimer(0);
      setCurrentSet(1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setExerciseTimer(0);
      setCurrentSet(1);
    }
  };

  const handleCompleteExercise = () => {
    const exerciseIndex = currentExerciseIndex;
    setCompletedExercises(prev => [...prev, exerciseIndex]);
    
    // Update exercise data
    setExerciseData(prev => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        completed: true
      }
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
      timestamp: new Date().toISOString()
    };

    setExerciseData(prev => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        sets: [...(prev[exerciseIndex]?.sets || []), setData]
      }
    }));

    setCurrentSet(prev => prev + 1);
  };

  const handleCompleteWorkout = async () => {
    try {
      const sessionData = {
        duration: Math.floor(timer / 60),
        totalExercises: workoutData?.exercises?.length || 0,
        completedExercises: completedExercises.length,
        totalSets: Object.values(exerciseData).reduce((total, ex) => total + (ex.sets?.length || 0), 0),
        exercises: Object.keys(exerciseData).map(index => ({
          exerciseIndex: parseInt(index),
          completed: exerciseData[index].completed,
          actualSets: exerciseData[index].sets,
          notes: exerciseData[index].notes
        })),
        notes: notes,
        averageIntensity: workoutData?.intensity || 'Moderate'
      };

      await onComplete(sessionData);
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Failed to complete workout. Please try again.');
    }
  };

  const currentExercise = workoutData?.exercises?.[currentExerciseIndex];
  const exercises = workoutData?.exercises || [];
  const progressPercentage = exercises.length > 0 ? (completedExercises.length / exercises.length) * 100 : 0;

  // Handle empty exercises
  if (!loading && exercises.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 m-4 max-w-md w-full">
          <div className="text-center">
            <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No Exercises Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This workout "{workoutData?.name}" doesn't have any exercises yet. 
              Add some exercises to get started!
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => {
                  // Navigate to add exercises or close
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Exercises
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 m-4 max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading workout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {workoutData?.name || 'Workout Session'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Week {weekNumber}, Day {dayNumber}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress: {completedExercises.length} of {exercises.length} exercises
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

        <div className="flex h-[calc(90vh-200px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Timer Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">Total Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatTime(timer)}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Dumbbell className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-300">Exercise Time</span>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatTime(exerciseTimer)}
                </p>
              </div>
            </div>

            {/* Rest Timer */}
            {isResting && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg mb-6 text-center">
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-2">
                  Rest Time
                </h3>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {formatTime(restTimer)}
                </p>
                <button
                  onClick={() => setIsResting(false)}
                  className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Skip Rest
                </button>
              </div>
            )}

            {/* Current Exercise */}
            {currentExercise && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentExercise.name}
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                  </span>
                </div>

                {currentExercise.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {currentExercise.description}
                  </p>
                )}

                {/* Exercise Details */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sets</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentExercise.sets || 3}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reps</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentExercise.reps || '8-12'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentExercise.weight || 'Body weight'}
                    </p>
                  </div>
                </div>

                {/* Set Tracking */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Current Set: {currentSet}
                  </h4>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Reps"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      id={`reps-${currentExerciseIndex}`}
                    />
                    <input
                      type="number"
                      placeholder="Weight (kg)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      id={`weight-${currentExerciseIndex}`}
                    />
                    <button
                      onClick={() => {
                        const reps = document.getElementById(`reps-${currentExerciseIndex}`).value;
                        const weight = document.getElementById(`weight-${currentExerciseIndex}`).value;
                        handleSetComplete(parseInt(reps) || 0, parseFloat(weight) || null);
                        document.getElementById(`reps-${currentExerciseIndex}`).value = '';
                        document.getElementById(`weight-${currentExerciseIndex}`).value = '';
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Complete Set
                    </button>
                  </div>
                </div>

                {/* Completed Sets */}
                {exerciseData[currentExerciseIndex]?.sets?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Completed Sets:</h4>
                    <div className="space-y-1">
                      {exerciseData[currentExerciseIndex].sets.map((set, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
                          <span>Set {set.set}</span>
                          <span>{set.reps} reps {set.weight ? `@ ${set.weight}kg` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exercise Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exercise Notes
              </label>
              <textarea
                value={exerciseData[currentExerciseIndex]?.notes || ''}
                onChange={(e) => setExerciseData(prev => ({
                  ...prev,
                  [currentExerciseIndex]: {
                    ...prev[currentExerciseIndex],
                    notes: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows="3"
                placeholder="Add notes about this exercise..."
              />
            </div>
          </div>

          {/* Exercise List Sidebar */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Exercise List</h3>
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index === currentExerciseIndex
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600'
                      : completedExercises.includes(index)
                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                  }`}
                  onClick={() => setCurrentExerciseIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {exercise.name}
                    </span>
                    {completedExercises.includes(index) ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : index === currentExerciseIndex ? (
                      <Circle className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {exercise.sets || 3} sets × {exercise.reps || '8-12'} reps
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                <SkipBack className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleStartPause}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === exercises.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                <span>Next</span>
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCompleteExercise}
                disabled={completedExercises.includes(currentExerciseIndex)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Complete Exercise
              </button>

              <button
                onClick={handleCompleteWorkout}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Finish Workout
              </button>
            </div>
          </div>

          {/* Workout Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workout Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="How did this workout feel? Any observations..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}