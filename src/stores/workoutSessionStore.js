// stores/workoutSessionStore.js - Updated with React Query integration
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useWorkoutSessionStore = create(
  devtools(
    (set, get) => ({
      // UI State - Keep in Zustand
      currentExerciseIndex: 0,
      isPlaying: false,
      timer: 0,
      exerciseTimer: 0,
      currentSet: 1,
      completedExercises: [],
      exerciseData: {},
      restTimer: 0,
      isResting: false,
      notes: '',
      soundEnabled: true,
      isEditing: false,
      showAddExerciseModal: false,

      // Timer actions
      incrementTimer: () => set((state) => ({ timer: state.timer + 1 })),
      incrementExerciseTimer: () => set((state) => ({ exerciseTimer: state.exerciseTimer + 1 })),
      resetExerciseTimer: () => set({ exerciseTimer: 0 }),
      
      // Playback controls
      togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      // Exercise navigation
      setCurrentExerciseIndex: (index) => set({ 
        currentExerciseIndex: index,
        exerciseTimer: 0,
        currentSet: 1 
      }),
      
      nextExercise: (totalExercises) => {
        const { currentExerciseIndex } = get();
        const maxIndex = totalExercises - 1;
        if (currentExerciseIndex < maxIndex) {
          set({
            currentExerciseIndex: currentExerciseIndex + 1,
            exerciseTimer: 0,
            currentSet: 1
          });
        }
      },
      
      previousExercise: () => {
        const { currentExerciseIndex } = get();
        if (currentExerciseIndex > 0) {
          set({
            currentExerciseIndex: currentExerciseIndex - 1,
            exerciseTimer: 0,
            currentSet: 1
          });
        }
      },

      // Set management
      incrementCurrentSet: () => set((state) => ({ currentSet: state.currentSet + 1 })),
      
      // Exercise completion
      completeExercise: (exerciseIndex, totalExercises, restTime = 60) => {
        const { completedExercises, exerciseData, currentExerciseIndex } = get();
        
        set({
          completedExercises: [...completedExercises, exerciseIndex],
          exerciseData: {
            ...exerciseData,
            [exerciseIndex]: {
              ...exerciseData[exerciseIndex],
              completed: true,
            }
          }
        });

        // Start rest timer if not last exercise
        if (currentExerciseIndex < totalExercises - 1) {
          set({ restTimer: restTime, isResting: true });
          get().nextExercise(totalExercises);
        }
      },

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
              sets: [...(exerciseData[exerciseIndex]?.sets || []), completeSetData],
            }
          },
          currentSet: currentSet + 1
        });
      },

      // Rest timer
      setRestTimer: (time) => set({ restTimer: time }),
      decrementRestTimer: () => {
        const { restTimer } = get();
        if (restTimer > 1) {
          set({ restTimer: restTimer - 1 });
        } else {
          set({ restTimer: 0, isResting: false });
          return true; // Indicates rest is complete
        }
        return false;
      },
      stopRest: () => set({ isResting: false, restTimer: 0 }),

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
            }
          }
        });
      },

      // Settings
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleEditing: () => set((state) => ({ isEditing: !state.isEditing })),
      toggleAddExerciseModal: () => set((state) => ({ showAddExerciseModal: !state.showAddExerciseModal })),

      // Initialize exercise data from workout (called when React Query data changes)
      initializeExerciseData: (workout) => {
        const initialData = {};
        if (workout?.exercises && workout.exercises.length > 0) {
          workout.exercises.forEach((exercise, index) => {
            initialData[index] = {
              completed: exercise.isCompleted || false,
              sets: exercise.completedSets || [],
              notes: exercise.notes || "",
            };
          });

          // Set completed exercises
          const completed = workout.exercises
            .map((ex, idx) => (ex.isCompleted ? idx : null))
            .filter((idx) => idx !== null);
          
          set({ 
            exerciseData: initialData,
            completedExercises: completed 
          });
        }
      },

      // Reset store
      reset: () => set({
        currentExerciseIndex: 0,
        isPlaying: false,
        timer: 0,
        exerciseTimer: 0,
        currentSet: 1,
        completedExercises: [],
        exerciseData: {},
        restTimer: 0,
        isResting: false,
        notes: '',
        soundEnabled: true,
        isEditing: false,
        showAddExerciseModal: false,
      }),

      // Computed getters (now need workout data passed in)
      getCurrentExercise: (exercises) => {
        const { currentExerciseIndex } = get();
        return exercises?.[currentExerciseIndex];
      },

      getProgressPercentage: (totalExercises) => {
        const { completedExercises } = get();
        return totalExercises > 0 ? (completedExercises.length / totalExercises) * 100 : 0;
      },
    }),
    {
      name: 'workout-session-store',
    }
  )
);

export default useWorkoutSessionStore;