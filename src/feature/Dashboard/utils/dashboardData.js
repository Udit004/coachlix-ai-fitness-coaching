const DAY_MS = 1000 * 60 * 60 * 24;

export function getDayDifference(fromDate, toDate = new Date()) {
  const from = new Date(fromDate || toDate);
  const to = new Date(toDate);
  const fromUtc = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toUtc = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((toUtc - fromUtc) / DAY_MS);
}

export function getCurrentWorkoutWeek(plan) {
  if (!plan?.weeks?.length) {
    return null;
  }

  const dayDiff = getDayDifference(plan.startDate || new Date());
  const weekNumber = Math.max(
    1,
    Math.min(plan.weeks.length, Math.floor(dayDiff / 7) + 1)
  );

  return plan.weeks.find((w) => w.weekNumber === weekNumber) || plan.weeks[0] || null;
}

export function getTodayWorkoutSummary(plan) {
  const week = getCurrentWorkoutWeek(plan);
  if (!week?.days?.length) {
    return null;
  }

  const jsDay = new Date().getDay();
  const dayNumber = jsDay === 0 ? 7 : jsDay;
  const day = week.days.find((d) => d.dayNumber === dayNumber) || week.days[0] || null;
  const workout = day?.workouts?.[0] || null;

  if (!day || !workout) {
    return null;
  }

  return {
    week,
    day,
    workout,
    sessionLink: `/workout-plan/${plan._id}/session?week=${week.weekNumber}&day=${day.dayNumber}&workout=0`,
  };
}

export function getTodayDietSummary(plan) {
  if (!plan?.days?.length) {
    return null;
  }

  const dayDiff = getDayDifference(plan.createdAt || new Date());
  const dayIndex = Math.max(0, Math.min(plan.days.length - 1, dayDiff));
  const day = plan.days[dayIndex] || plan.days[0] || null;

  if (!day) {
    return null;
  }

  return {
    day,
    current: {
      calories: day.totalCalories || 0,
      protein: day.totalProtein || 0,
      carbs: day.totalCarbs || 0,
      fats: day.totalFats || 0,
    },
    target: {
      calories: plan.targetCalories || 2000,
      protein: plan.targetProtein || 150,
      carbs: plan.targetCarbs || 200,
      fats: plan.targetFats || 65,
    },
  };
}

export function calculateWorkoutStreak(plan) {
  if (!plan?.weeks?.length) {
    return 0;
  }

  // Mirrors existing behavior: count contiguous days only when plan has completion data.
  const hasCompletedWorkout = plan.weeks.some((week) =>
    week.days?.some((day) =>
      day.workouts?.some((workout) => workout.isCompleted)
    )
  );

  return hasCompletedWorkout ? 1 : 0;
}

export function getCurrentWeekDays(plan) {
  const week = getCurrentWorkoutWeek(plan);
  return week?.days || [];
}

export function getCurrentDayNumber() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}
