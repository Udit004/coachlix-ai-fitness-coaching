// hooks/useWorkoutSession.js
import { useEffect, useRef } from 'react';
import useWorkoutSessionStore from '../stores/workoutSessionStore';

// Hook for managing timers
export const useWorkoutTimer = () => {
  const { isPlaying, incrementTimer, incrementExerciseTimer } = useWorkoutSessionStore();
  const timerRef = useRef(null);
  const exerciseTimerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        incrementTimer();
      }, 1000);

      exerciseTimerRef.current = setInterval(() => {
        incrementExerciseTimer();
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(exerciseTimerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(exerciseTimerRef.current);
    };
  }, [isPlaying, incrementTimer, incrementExerciseTimer]);

  return { timerRef, exerciseTimerRef };
};

// Hook for managing rest timer
export const useRestTimer = () => {
  const { 
    isResting, 
    restTimer, 
    soundEnabled, 
    decrementRestTimer 
  } = useWorkoutSessionStore();
  
  const restTimerRef = useRef(null);

  const playSound = () => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

  useEffect(() => {
    if (isResting && restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        const isComplete = decrementRestTimer();
        if (isComplete) {
          playSound();
        }
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }

    return () => clearInterval(restTimerRef.current);
  }, [isResting, restTimer, decrementRestTimer]);

  return { restTimerRef, playSound };
};

// Hook for workout session management
export const useWorkoutSessionManager = (planId, weekNumber, dayNumber, workoutId, user) => {
  const {
    loading,
    error,
    workoutData,
    loadWorkoutData,
    reset,
    saveProgress,
    completeWorkout,
    addExercises,
  } = useWorkoutSessionStore();

  // Load data on mount
  useEffect(() => {
    if (planId && user) {
      loadWorkoutData(planId, weekNumber, dayNumber, workoutId);
    }

    return () => {
      reset();
    };
  }, [planId, user, weekNumber, dayNumber, workoutId, loadWorkoutData, reset]);

  // Helper functions
  const handleSaveProgress = async () => {
    const result = await saveProgress(planId, weekNumber, dayNumber, workoutId);
    return result;
  };

  const handleCompleteWorkout = async () => {
    const result = await completeWorkout(planId, weekNumber, dayNumber, workoutId);
    return result;
  };

  const handleAddExercises = async (selectedExercises) => {
    const result = await addExercises(
      planId,
      weekNumber,
      dayNumber,
      workoutId,
      selectedExercises,
      () => loadWorkoutData(planId, weekNumber, dayNumber, workoutId)
    );
    return result;
  };

  return {
    loading,
    error,
    workoutData,
    handleSaveProgress,
    handleCompleteWorkout,
    handleAddExercises,
  };
};

// Hook for formatting time
export const useTimeFormatter = () => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return { formatTime };
};

// Hook for exercise navigation
export const useExerciseNavigation = () => {
  const {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    nextExercise,
    previousExercise,
    getExercises,
  } = useWorkoutSessionStore();

  const exercises = getExercises();

  const canGoNext = currentExerciseIndex < exercises.length - 1;
  const canGoPrevious = currentExerciseIndex > 0;

  return {
    currentExerciseIndex,
    canGoNext,
    canGoPrevious,
    setCurrentExerciseIndex,
    nextExercise,
    previousExercise,
  };
};

// Hook for set management
export const useSetManagement = () => {
  const {
    currentSet,
    exerciseData,
    currentExerciseIndex,
    addCompletedSet,
    incrementCurrentSet,
  } = useWorkoutSessionStore();

  const addSet = (reps, weight = null) => {
    addCompletedSet(currentExerciseIndex, { reps, weight });
  };

  const getCurrentExerciseSets = () => {
    return exerciseData[currentExerciseIndex]?.sets || [];
  };

  return {
    currentSet,
    addSet,
    getCurrentExerciseSets,
    incrementCurrentSet,
  };
};

// Hook for exercise completion
export const useExerciseCompletion = () => {
  const {
    completedExercises,
    completeExercise,
    currentExerciseIndex,
    getProgressPercentage,
  } = useWorkoutSessionStore();

  const isCurrentExerciseCompleted = completedExercises.includes(currentExerciseIndex);
  const progressPercentage = getProgressPercentage();

  const markCurrentExerciseComplete = () => {
    completeExercise(currentExerciseIndex);
  };

  return {
    completedExercises,
    isCurrentExerciseCompleted,
    progressPercentage,
    markCurrentExerciseComplete,
  };
};