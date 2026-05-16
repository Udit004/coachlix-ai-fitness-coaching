import { redis } from "@/lib/redis";

export const recalculatePlanAggregates = (plan) => {
  if (!plan?.weeks) return;

  let planTotalDuration = 0;
  let planTotalCalories = 0;
  let planTotalWorkouts = 0;
  let planCompletedWorkouts = 0;

  plan.weeks.forEach((week) => {
    let weekTotalDuration = 0;
    let weekTotalWorkouts = 0;

    week.days.forEach((day) => {
      const workouts = day.workouts || [];
      day.totalDuration = workouts.reduce(
        (sum, workout) => sum + (workout.estimatedDuration || 0),
        0
      );
      day.totalCaloriesBurned = workouts.reduce(
        (sum, workout) => sum + (workout.caloriesBurned || 0),
        0
      );

      weekTotalDuration += day.totalDuration;
      weekTotalWorkouts += workouts.length;

      planCompletedWorkouts += workouts.filter((w) => w.isCompleted).length;
    });

    week.totalDuration = weekTotalDuration;
    week.totalWorkouts = weekTotalWorkouts;

    planTotalDuration += weekTotalDuration;
    planTotalWorkouts += weekTotalWorkouts;
    planTotalCalories += week.days.reduce(
      (sum, day) => sum + (day.totalCaloriesBurned || 0),
      0
    );
  });

  plan.stats.totalWorkouts = planTotalWorkouts;
  plan.stats.totalDuration = planTotalDuration;
  plan.stats.totalCalories = planTotalCalories;
  plan.stats.averageWorkoutDuration =
    planTotalWorkouts > 0 ? Math.round(planTotalDuration / planTotalWorkouts) : 0;
  plan.stats.completionRate =
    planTotalWorkouts > 0
      ? Math.round((planCompletedWorkouts / planTotalWorkouts) * 100)
      : 0;
};

export const invalidateWorkoutPlanCache = async (userId, planId) => {
  try {
    const listPattern = `user:workout-plans-list:${userId}:*`;
    const listKeys = await redis.keys(listPattern);
    if (listKeys && listKeys.length > 0) {
      await Promise.all(listKeys.map((key) => redis.del(key)));
    }

    const planKey = `user:workout-plan:${userId}:${planId}`;
    await redis.del(planKey);

    const sessionPattern = `user:workout-session:${userId}:${planId}:*`;
    const sessionKeys = await redis.keys(sessionPattern);
    if (sessionKeys && sessionKeys.length > 0) {
      await Promise.all(sessionKeys.map((key) => redis.del(key)));
    }
  } catch (cacheError) {
    console.error("Cache invalidation error:", cacheError);
  }
};
