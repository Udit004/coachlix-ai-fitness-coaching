import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useWorkoutSessionStore = create(
  devtools(
    (set, get) => ({
      // UI State
      showAddExerciseModal: false,
      currentExerciseIndex: 0,
      isPlaying: false,
      isEditing: false,
      soundEnabled: true,

      // Timer State
      timer: 0,
      exerciseTimer: 0,
      isTimerRunning: false,
      restTimer: 0,
      isResting: false,
      currentSet: 1,

      // Exercise Data - key is exercise index
      exerciseData: {},

      workoutData: null,
      planData: null,

      // Session Data
      completedExercises: [],
      notes: "",

      // Set workout data
      setWorkoutData: (workoutData, planData) => {
        console.log("🔄 [STORE] Setting workout data:", workoutData?.name);
        set({
          workoutData,
          planData,
        });
      },

      // Actions
      toggleAddExerciseModal: () =>
        set((state) => ({
          showAddExerciseModal: !state.showAddExerciseModal,
        })),

      // Initialize exercise data
      initializeExerciseData: (workoutData) => {
        console.log(
          "🚀 [STORE] Initializing exercise data for workout:",
          workoutData?.name
        );

        if (
          !workoutData ||
          !workoutData.exercises ||
          workoutData.exercises.length === 0
        ) {
          console.warn("⚠️ [STORE] No exercises found in workout data:", {
            hasWorkoutData: !!workoutData,
            hasExercises: !!workoutData?.exercises,
            exerciseCount: workoutData?.exercises?.length || 0,
          });
          set({ exerciseData: {} });
          return;
        }

        const exercises = workoutData.exercises;
        console.log(
          "📝 [STORE] Found exercises:",
          exercises.length,
          exercises.map((e) => e.name)
        );

        const exerciseData = {};

        exercises.forEach((exercise, index) => {
          exerciseData[index] = {
            completed: exercise.isCompleted || false,
            sets: exercise.completedSets || exercise.sets || [],
            notes: exercise.notes || "",
            personalRecord: exercise.personalRecord || {
              weight: 0,
              reps: 0,
              date: null,
            },
          };
        });

        // Set completed exercises
        const completed = exercises
          .map((ex, idx) => (ex.isCompleted ? idx : null))
          .filter((idx) => idx !== null);

        console.log("✅ [STORE] Initialized exercise data:", {
          exerciseDataKeys: Object.keys(exerciseData),
          completedExercises: completed,
          firstExercise: exerciseData[0],
        });

        set({
          exerciseData,
          completedExercises: completed,
          currentExerciseIndex: 0,
          currentSet: 1,
        });
      },

      // Update exercise data
      updateExerciseData: (exerciseIndex, data) =>
        set((state) => ({
          exerciseData: {
            ...state.exerciseData,
            [exerciseIndex]: {
              ...state.exerciseData[exerciseIndex],
              ...data,
            },
          },
        })),

      // Get current exercise
      getCurrentExercise: (exercises) => {
        const { currentExerciseIndex } = get();
        if (!exercises || !exercises.length) {
          console.warn(
            "⚠️ [STORE] No exercises provided to getCurrentExercise"
          );
          return null;
        }
        const current = exercises[currentExerciseIndex] || exercises[0];
        console.log(
          "🎯 [STORE] Current exercise:",
          current?.name,
          "at index:",
          currentExerciseIndex
        );
        return current;
      },

      // Get progress percentage
      getProgressPercentage: (totalExercises) => {
        const { completedExercises } = get();
        if (!totalExercises) return 0;
        const percentage = Math.round(
          (completedExercises.length / totalExercises) * 100
        );
        console.log(
          "📊 [STORE] Progress:",
          `${completedExercises.length}/${totalExercises} = ${percentage}%`
        );
        return percentage;
      },

      // Set current exercise
      setCurrentExerciseIndex: (index) =>
        set({
          currentExerciseIndex: index,
          exerciseTimer: 0,
          currentSet: 1,
        }),

      // Exercise navigation
      nextExercise: (totalExercises) => {
        const { currentExerciseIndex } = get();
        const maxIndex = totalExercises - 1;
        if (currentExerciseIndex < maxIndex) {
          set({
            currentExerciseIndex: currentExerciseIndex + 1,
            exerciseTimer: 0,
            currentSet: 1,
          });
        }
      },

      previousExercise: () => {
        const { currentExerciseIndex } = get();
        if (currentExerciseIndex > 0) {
          set({
            currentExerciseIndex: currentExerciseIndex - 1,
            exerciseTimer: 0,
            currentSet: 1,
          });
        }
      },

      // Timer actions
      togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
      incrementTimer: () => set((state) => ({ timer: state.timer + 1 })),
      incrementExerciseTimer: () =>
        set((state) => ({ exerciseTimer: state.exerciseTimer + 1 })),
      resetExerciseTimer: () => set({ exerciseTimer: 0 }),
      startTimer: () => set({ isTimerRunning: true, isPlaying: true }),
      pauseTimer: () => set({ isTimerRunning: false, isPlaying: false }),
      resetTimer: () =>
        set({ timer: 0, isTimerRunning: false, isPlaying: false }),
      updateTimer: () =>
        set((state) => ({
          timer: state.isTimerRunning ? state.timer + 1 : state.timer,
        })),

      // Set management
      incrementCurrentSet: () =>
        set((state) => ({ currentSet: state.currentSet + 1 })),

      // Set completion
      addCompletedSet: (exerciseIndex, setData) => {
        const { exerciseData, currentSet } = get();
        const completeSetData = {
          set: currentSet,
          ...setData,
          timestamp: new Date().toISOString(),
        };

        set({
          exerciseData: {
            ...exerciseData,
            [exerciseIndex]: {
              ...exerciseData[exerciseIndex],
              sets: [
                ...(exerciseData[exerciseIndex]?.sets || []),
                completeSetData,
              ],
            },
          },
          currentSet: currentSet + 1,
        });
      },

      setRestTimer: (time) => set({ restTimer: time, isResting: true }),
      decrementRestTimer: () => {
        const { restTimer } = get();
        if (restTimer > 1) {
          set({ restTimer: restTimer - 1 });
          return false;
        } else {
          set({ restTimer: 0, isResting: false });
          return true; // Indicates rest is complete
        }
      },
      stopRest: () => set({ isResting: false, restTimer: 0 }),
      startRestTimer: (duration = 60) =>
        set({
          restTimer: duration,
          isResting: true,
        }),
      pauseRestTimer: () => set({ isResting: false }),
      resetRestTimer: () => set({ restTimer: 0, isResting: false }),
      updateRestTimer: () =>
        set((state) => ({
          restTimer:
            state.isResting && state.restTimer > 0
              ? state.restTimer - 1
              : state.restTimer,
        })),

      // Exercise completion
      completeExercise: (exerciseIndex, totalExercises, restTime = 60) => {
        const { completedExercises, exerciseData, currentExerciseIndex } =
          get();

        console.log("✅ [STORE] Completing exercise:", exerciseIndex);

        set({
          completedExercises: [
            ...new Set([...completedExercises, exerciseIndex]),
          ],
          exerciseData: {
            ...exerciseData,
            [exerciseIndex]: {
              ...exerciseData[exerciseIndex],
              completed: true,
            },
          },
        });

        // Start rest timer if not last exercise
        if (currentExerciseIndex < totalExercises - 1) {
          set({ restTimer: restTime, isResting: true });
          get().nextExercise(totalExercises);
        }
      },

      // Notes
      setNotes: (notes) => set({ notes }),
      updateExerciseNotes: (exerciseIndex, notes) => {
        const { exerciseData } = get();
        set({
          exerciseData: {
            ...exerciseData,
            [exerciseIndex]: {
              ...exerciseData[exerciseIndex],
              notes,
            },
          },
        });
      },

      // Settings
      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleEditing: () => set((state) => ({ isEditing: !state.isEditing })),

      // Reset all state
      reset: () => {
        console.log("🧹 [STORE] Resetting all state");
        set({
          showAddExerciseModal: false,
          currentExerciseIndex: 0,
          isPlaying: false,
          isEditing: false,
          soundEnabled: true,
          timer: 0,
          exerciseTimer: 0,
          isTimerRunning: false,
          restTimer: 0,
          isResting: false,
          currentSet: 1,
          exerciseData: {},
          completedExercises: [],
          notes: "",
          workoutData: null,
          planData: null,
        });
      },
    }),
    {
      name: "workout-session-store",
    }
  )
);

export default useWorkoutSessionStore;