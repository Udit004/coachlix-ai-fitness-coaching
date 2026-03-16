import { getWorkoutPlan } from "@/service/workoutApiBase";
import workoutSessionService from "@/feature/workout/session/services/workoutSessionService";

export const getProgressHistory = (planId) =>
  workoutSessionService.getProgressHistory(planId);

export const getWorkoutStats = (planId) =>
  workoutSessionService.getWorkoutStats(planId);

export const getWorkoutProgressPlan = (planId) => getWorkoutPlan(planId);

const workoutProgressService = {
  getWorkoutProgressPlan,
  getProgressHistory,
  getWorkoutStats,
};

export default workoutProgressService;
