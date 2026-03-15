import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workoutPlanService from "../services/workoutSessionService";
import { useAuth } from "@/hooks/useAuth";
import { workoutKeys } from "@/hooks/useWorkoutQueries";

// ─── Query ────────────────────────────────────────────────────────────────────

export const useWorkoutSession = (planId, weekNumber, dayNumber, workoutId) => {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: workoutKeys.session(planId, weekNumber, dayNumber, workoutId),
    queryFn: async () => {
      console.log('🔍 Fetching workout session:', { planId, weekNumber, dayNumber, workoutId });

      const response = await workoutPlanService.getWorkoutPlan(planId);
      console.log('📦 Full plan response:', response);

      const plan = response.plan || response;
      console.log('📋 Plan data:', plan);

      if (!plan || !plan.weeks) {
        console.error('❌ Invalid plan structure:', plan);
        throw new Error('Invalid plan structure');
      }

      const week = plan.weeks?.find((w) => w.weekNumber === parseInt(weekNumber));
      console.log('📅 Found week:', week, 'Looking for weekNumber:', weekNumber);

      if (!week) {
        console.error('❌ Week not found:', { weekNumber, availableWeeks: plan.weeks?.map((w) => w.weekNumber) });
        throw new Error(`Week ${weekNumber} not found`);
      }

      const day = week.days?.find((d) => d.dayNumber === parseInt(dayNumber));
      console.log('📆 Found day:', day, 'Looking for dayNumber:', dayNumber);

      if (!day) {
        console.error('❌ Day not found:', { dayNumber, availableDays: week.days?.map((d) => d.dayNumber) });
        throw new Error(`Day ${dayNumber} not found`);
      }

      let workout;
      let workoutIndex = -1;
      const numericWorkoutId = parseInt(workoutId);

      console.log('🏋️ Looking for workout:', { workoutId, numericWorkoutId, availableWorkouts: day.workouts?.length });

      if (!isNaN(numericWorkoutId)) {
        workout = day.workouts?.[numericWorkoutId];
        workoutIndex = !isNaN(numericWorkoutId) ? numericWorkoutId : -1;
        console.log('🔢 Workout by index:', workout);
      }

      if (!workout) {
        const foundIndex = day.workouts?.findIndex(
          (w, index) =>
            w._id?.toString() === workoutId ||
            w.id?.toString() === workoutId ||
            index.toString() === workoutId
        );
        if (foundIndex !== undefined && foundIndex !== -1) {
          workoutIndex = foundIndex;
          workout = day.workouts?.[foundIndex];
        }
        console.log('🆔 Workout by ID:', workout, 'at index:', workoutIndex);
      }

      if (!workout) {
        console.error('❌ Workout not found:', {
          workoutId,
          numericWorkoutId,
          availableWorkouts: day.workouts?.map((w, i) => ({ index: i, _id: w._id, id: w.id, name: w.name })),
        });
        throw new Error(`Workout not found: ${workoutId}`);
      }

      console.log('✅ Found workout:', {
        name: workout.name,
        exerciseCount: workout.exercises?.length || 0,
        exercises: workout.exercises?.map((e) => ({ name: e.name, _id: e._id })),
        workoutIndex,
      });

      return { plan, workout, workoutIndex };
    },
    enabled:
      !!user &&
      !loading &&
      !!(planId && weekNumber !== undefined && dayNumber !== undefined && workoutId !== undefined),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error('🚨 useWorkoutSession error:', error);
    },
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useAddExercisesToWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, weekNumber, dayNumber, workoutId, exercises }) =>
      workoutPlanService.batchAddExercisesToWorkout(
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exercises
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.detail(variables.planId),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.session(
          variables.planId,
          variables.weekNumber,
          variables.dayNumber,
          variables.workoutId
        ),
      });
    },
  });
};

export const useCompleteWorkoutSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, weekNumber, dayNumber, workoutIndex, exerciseDataMap }) => {
      console.log('🏁 Completing workout session (server):', { planId, weekNumber, dayNumber, workoutIndex });

      if (exerciseDataMap && typeof exerciseDataMap === 'object') {
        const updatePromises = Object.entries(exerciseDataMap).map(([exerciseIndexStr, data]) => {
          const exerciseIndex = parseInt(exerciseIndexStr);
          if (Number.isNaN(exerciseIndex)) return Promise.resolve();
          const payload = {
            sets: Array.isArray(data.sets) ? data.sets : [],
            isCompleted: !!data.completed,
            notes: data.notes || '',
            personalRecord:
              data.personalRecord && data.personalRecord.weight && data.personalRecord.reps
                ? data.personalRecord
                : undefined,
          };
          return workoutPlanService
            .updateExerciseProgress(planId, weekNumber, dayNumber, workoutIndex, exerciseIndex, payload)
            .catch((e) => {
              console.warn('Exercise update failed for index', exerciseIndex, e);
            });
        });
        await Promise.all(updatePromises);
      }

      return await workoutPlanService.updateWorkoutStatus(
        planId,
        weekNumber,
        dayNumber,
        workoutIndex,
        'completed'
      );
    },
    onSuccess: (data, variables) => {
      console.log('✅ Workout completed on server');
      queryClient.invalidateQueries({ queryKey: workoutKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.stats(variables.planId) });
      queryClient.invalidateQueries({ queryKey: [...workoutKeys.progress(), variables.planId] });
    },
    onError: (error) => {
      console.error('❌ Failed to complete workout:', error);
    },
  });
};

export const useSaveWorkoutProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, weekNumber, dayNumber, workoutIndex, exerciseDataMap }) => {
      console.log('💾 Saving workout progress (server):', { planId, weekNumber, dayNumber, workoutIndex });

      if (!exerciseDataMap || typeof exerciseDataMap !== 'object') {
        return { success: false, message: 'No exercise data to save' };
      }

      const updatePromises = Object.entries(exerciseDataMap).map(([exerciseIndexStr, data]) => {
        const exerciseIndex = parseInt(exerciseIndexStr);
        if (Number.isNaN(exerciseIndex)) return Promise.resolve();
        const payload = {
          sets: Array.isArray(data.sets) ? data.sets : [],
          isCompleted: !!data.completed,
          notes: data.notes || '',
          personalRecord:
            data.personalRecord && data.personalRecord.weight && data.personalRecord.reps
              ? data.personalRecord
              : undefined,
        };
        return workoutPlanService
          .updateExerciseProgress(planId, weekNumber, dayNumber, workoutIndex, exerciseIndex, payload)
          .catch((e) => {
            console.warn('Exercise update failed for index', exerciseIndex, e);
          });
      });

      await Promise.all(updatePromises);
      return { success: true };
    },
    onSuccess: (data, variables) => {
      console.log('✅ Progress saved to server');
      queryClient.invalidateQueries({
        queryKey: workoutKeys.session(
          variables.planId,
          variables.weekNumber,
          variables.dayNumber,
          variables.workoutIndex
        ),
      });
      queryClient.invalidateQueries({ queryKey: workoutKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.stats(variables.planId) });
    },
    onError: (error) => {
      console.error('❌ Failed to save progress:', error);
    },
  });
};

