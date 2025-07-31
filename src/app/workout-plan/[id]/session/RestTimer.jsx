// components/workout-session/RestTimer.jsx
import React, { useEffect, useRef } from 'react';
import useWorkoutSessionStore from '../../stores/workoutSessionStore';

const RestTimer = () => {
  const {
    isResting,
    restTimer,
    soundEnabled,
    decrementRestTimer,
    stopRest,
  } = useWorkoutSessionStore();

  const restTimerRef = useRef(null);

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

  if (!isResting) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl text-center">
      <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-2">
        Rest Time
      </h3>
      <p className="text-4xl font-bold text-orange-900 dark:text-orange-100 mb-4">
        {formatTime(restTimer)}
      </p>
      <button
        onClick={stopRest}
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
      >
        Skip Rest
      </button>
    </div>
  );
};

export default RestTimer;