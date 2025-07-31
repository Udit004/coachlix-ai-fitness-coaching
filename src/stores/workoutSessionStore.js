// stores/workoutSessionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import workoutPlanService from '../service/workoutPlanService';

const useWorkoutSessionStore = create(
  devtools(
    (set, get) => ({
      // State
      loading: true,
      saving: false,
      workoutData: null,
      planData: null,
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
      error: null,

      // Actions
      setLoading: (loading) => set({ loading }),
      setSaving: (saving) => set({ saving }),
      setError: (error) => set({ error }),
      
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
      
      nextExercise: () => {
        const { currentExerciseIndex, workoutData } = get();
        const maxIndex = (workoutData?.exercises?.length || 0) - 1;
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
      completeExercise: (exerciseIndex) => {
        const { completedExercises, exerciseData, workoutData, currentExerciseIndex } = get();
        
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
        if (currentExerciseIndex < (workoutData?.exercises?.length || 0) - 1) {
          const currentExercise = workoutData?.exercises?.[currentExerciseIndex];
          const restTime = currentExercise?.restTime || 60;
          set({ restTimer: restTime, isResting: true });
          get().nextExercise();
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

      // Data loading
      loadWorkoutData: async (planId, weekNumber, dayNumber, workoutId) => {
        try {
          set({ loading: true, error: null });
          
          const response = await workoutPlanService.getWorkoutPlan(planId);
          const plan = response.plan || response;
          
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

          // Initialize exercise data
          const initialData = {};
          if (workout.exercises && workout.exercises.length > 0) {
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
            
            set({ completedExercises: completed });
          }

          set({
            planData: plan,
            workoutData: workout,
            exerciseData: initialData,
            loading: false
          });

        } catch (error) {
          console.error("Error loading workout data:", error);
          set({ error: error.message, loading: false });
        }
      },

      // Save progress
      saveProgress: async (planId, weekNumber, dayNumber, workoutId) => {
        try {
          set({ saving: true, error: null });
          const { exerciseData, workoutData } = get();

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

          set({ saving: false });
          return { success: true };
        } catch (error) {
          console.error("Error saving progress:", error);
          set({ error: error.message, saving: false });
          return { success: false, error: error.message };
        }
      },

      // Complete workout
      completeWorkout: async (planId, weekNumber, dayNumber, workoutId) => {
        try {
          set({ saving: true, error: null });
          const { timer, workoutData, completedExercises, exerciseData, notes } = get();

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

          set({ saving: false });
          return { success: true };
        } catch (error) {
          console.error("Error completing workout:", error);
          set({ error: error.message, saving: false });
          return { success: false, error: error.message };
        }
      },

      // Add exercises
      addExercises: async (planId, weekNumber, dayNumber, workoutId, selectedExercises, refreshCallback) => {
        try {
          set({ saving: true, error: null });

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

          // Refresh workout data
          if (refreshCallback) {
            await refreshCallback();
          }

          set({ 
            saving: false, 
            showAddExerciseModal: false 
          });
          
          return { success: true, count: selectedExercises.length };
        } catch (error) {
          console.error("Error adding exercises:", error);
          set({ error: error.message, saving: false });
          return { success: false, error: error.message };
        }
      },

      // Reset store
      reset: () => set({
        loading: true,
        saving: false,
        workoutData: null,
        planData: null,
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
        error: null,
      }),

      // Computed getters
      getCurrentExercise: () => {
        const { workoutData, currentExerciseIndex } = get();
        return workoutData?.exercises?.[currentExerciseIndex];
      },

      getProgressPercentage: () => {
        const { workoutData, completedExercises } = get();
        const totalExercises = workoutData?.exercises?.length || 0;
        return totalExercises > 0 ? (completedExercises.length / totalExercises) * 100 : 0;
      },

      getExercises: () => {
        const { workoutData } = get();
        return workoutData?.exercises || [];
      },
    }),
    {
      name: 'workout-session-store',
    }
  )
);

export default useWorkoutSessionStore;