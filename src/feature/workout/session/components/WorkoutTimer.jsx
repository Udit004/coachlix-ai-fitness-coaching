// components/workout-session/WorkoutTimer.jsx
import React, { useEffect, useRef } from 'react';
import { Timer, Target } from 'lucide-react';
import useWorkoutSessionStore from '@/stores/workoutSessionStore';

const WorkoutTimer = () => {
  const {
    timer,
    exerciseTimer,
    isPlaying,
    incrementTimer,
    incrementExerciseTimer,
  } = useWorkoutSessionStore();

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
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
  );
};

export default WorkoutTimer;