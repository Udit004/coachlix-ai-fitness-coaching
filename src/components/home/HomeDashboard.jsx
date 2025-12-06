"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";
import { useAuthContext } from "@/auth/AuthContext";
import { useWorkoutPlans, useWorkoutStats } from "@/hooks/useWorkoutQueries";
import { useDietPlans, useUpdateDay } from "@/hooks/useDietPlanQueries";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Play, TrendingUp, Calendar } from "lucide-react";
import MacroProgressRing from "@/components/home/MacroProgressRing";
import WaterIntakeTracker from "@/components/home/WaterIntakeTracker";
import PersonalRecordsWidget from "@/components/home/PersonalRecordsWidget";
import WeeklyCalendarView from "@/components/home/WeeklyCalendarView";
import StreakCounter from "@/components/home/StreakCounter";

function WorkoutTodaySummary({ plan, onStart }) {
  try {
    const today = new Date();
    const planStart = plan.startDate ? new Date(plan.startDate) : today;
    const dayDiff = Math.floor((today.setHours(0,0,0,0) - planStart.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.max(1, Math.min(plan.weeks?.length || 1, Math.floor(dayDiff / 7) + 1));
    const week = plan.weeks?.find((w) => w.weekNumber === weekNumber) || plan.weeks?.[0];
    const jsDay = new Date().getDay(); // 0 Sun ... 6 Sat
    const mappedDayNumber = jsDay === 0 ? 7 : jsDay; // map Sun->7
    const day = week?.days?.find((d) => d.dayNumber === mappedDayNumber) || week?.days?.[0];
    const workout = day?.workouts?.[0];

    if (!week || !day || !workout) {
      return (
        <div className="text-gray-600 dark:text-gray-300">Rest day or no workout scheduled for today.</div>
      );
    }

    const sessionLink = `/workout-plan/${plan._id}/session?week=${week.weekNumber}&day=${day.dayNumber}&workout=0`;

    return (
      <div>
        <div className="mb-3">
          <div className="text-sm text-gray-500">{week?.weeklyGoal || `Week ${week.weekNumber}`}</div>
          <h4 className="text-xl font-semibold">{workout.name}</h4>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
          {workout.exercises?.slice(0, 6).map((ex, idx) => (
            <li key={idx}>
              <span className="font-medium">{ex.name}</span>{' '}
              {ex.targetSets ? `• ${ex.targetSets} sets` : null}{' '}
              {ex.targetReps ? `• ${ex.targetReps} reps` : null}
            </li>
          ))}
          {workout.exercises?.length > 6 && (<li>+{workout.exercises.length - 6} more…</li>)}
        </ul>
        <div className="mt-4"><Button onClick={() => onStart(sessionLink)} className="cursor-pointer">Start Workout</Button></div>
      </div>
    );
  } catch (e) {
    return <div className="text-gray-600">Unable to compute today's workout.</div>;
  }
}

function DietTodaySummary({ plan }) {
  try {
    const today = new Date();
    const planStart = plan.createdAt ? new Date(plan.createdAt) : today;
    const dayDiff = Math.floor((today.setHours(0,0,0,0) - planStart.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    const dayIndex = Math.max(0, Math.min((plan.days?.length || 1) - 1, dayDiff));
    const day = plan.days?.[dayIndex] || plan.days?.[0];

    if (!day) {
      return <div className="text-gray-600 dark:text-gray-300 text-sm">No meals scheduled for today.</div>;
    }

    const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snacks"];
    const meals = [...(day.meals || [])].sort((a, b) => mealOrder.indexOf(a.type) - mealOrder.indexOf(b.type));

    return (
      <div className="space-y-2">
        {mealOrder.slice(0, 3).map((type) => {
          const meal = meals.find((m) => m.type === type);
          if (!meal || !meal.items || meal.items.length === 0) return null;
          
          return (
            <div key={type} className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-white">{type}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {meal.items.slice(0, 2).map(it => it.name).join(", ")}
                  {meal.items.length > 2 && ` +${meal.items.length - 2} more`}
                </div>
              </div>
              <div className="text-xs text-gray-500 ml-2">
                {meal.totalCalories || 0} cal
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    return <div className="text-gray-600 text-sm">Unable to load meals.</div>;
  }
}

export default function HomeDashboard() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuthContext();

  const { data: workoutPlans } = useWorkoutPlans({ activeOnly: true });
  const { data: dietPlans } = useDietPlans({ activeOnly: true });
  const workoutPlanList = Array.isArray(workoutPlans)
    ? workoutPlans
    : (Array.isArray(workoutPlans?.plans) ? workoutPlans.plans : []);
  const dietPlanList = Array.isArray(dietPlans)
    ? dietPlans
    : (Array.isArray(dietPlans?.plans) ? dietPlans.plans : []);

  // Use the first active workout plan (there should only be one active)
  const selectedWorkoutPlan = workoutPlanList.find(p => p.isActive) || workoutPlanList[0] || null;
  // Use the first active diet plan (there should only be one active)
  const selectedDietPlan = dietPlanList.find(p => p.isActive) || dietPlanList[0] || null;

  const { data: workoutStats } = useWorkoutStats(selectedWorkoutPlan?._id);
  const updateDayMutation = useUpdateDay();

  // Calculate streaks
  const calculateWorkoutStreak = () => {
    if (!selectedWorkoutPlan?.weeks) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasWorkout = selectedWorkoutPlan.weeks.some(week =>
        week.days.some(day => {
          if (day.isRestDay) return false;
          return day.workouts?.some(w => w.isCompleted);
        })
      );
      if (hasWorkout) streak++; else break;
    }
    return streak;
  };

  const calculateNutritionStreak = () => {
    // Simple implementation - can be enhanced with actual tracking
    return 0; // TODO: Implement based on meal logging
  };

  // Get today's nutrition data
  const getTodaysNutrition = () => {
    if (!selectedDietPlan?.days) return null;
    const today = new Date();
    const planStart = selectedDietPlan.createdAt ? new Date(selectedDietPlan.createdAt) : today;
    const dayDiff = Math.floor((today.setHours(0,0,0,0) - planStart.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    const dayIndex = Math.max(0, Math.min((selectedDietPlan.days.length || 1) - 1, dayDiff));
    const day = selectedDietPlan.days[dayIndex];
    
    if (!day) return null;
    
    return {
      current: {
        calories: day.totalCalories || 0,
        protein: day.totalProtein || 0,
        carbs: day.totalCarbs || 0,
        fats: day.totalFats || 0,
      },
      target: {
        calories: selectedDietPlan.targetCalories || 2000,
        protein: selectedDietPlan.targetProtein || 150,
        carbs: selectedDietPlan.targetCarbs || 200,
        fats: selectedDietPlan.targetFats || 65,
      },
      waterIntake: day.waterIntake || 0,
      dayNumber: day.dayNumber,
    };
  };

  const nutritionData = getTodaysNutrition();

  // Get current week data for calendar view
  const getCurrentWeekData = () => {
    if (!selectedWorkoutPlan?.weeks) return [];
    const today = new Date();
    const planStart = selectedWorkoutPlan.startDate ? new Date(selectedWorkoutPlan.startDate) : today;
    const dayDiff = Math.floor((today.setHours(0,0,0,0) - planStart.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.max(1, Math.min(selectedWorkoutPlan.weeks.length, Math.floor(dayDiff / 7) + 1));
    const week = selectedWorkoutPlan.weeks.find((w) => w.weekNumber === weekNumber);
    return week?.days || [];
  };

  const currentDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();

  // Handle water intake update
  const handleWaterIntakeChange = async (newValue) => {
    if (!selectedDietPlan || !nutritionData) return;
    
    try {
      const dayToUpdate = selectedDietPlan.days.find(d => d.dayNumber === nutritionData.dayNumber);
      if (dayToUpdate) {
        await updateDayMutation.mutateAsync({
          planId: selectedDietPlan._id,
          dayNumber: nutritionData.dayNumber,
          dayData: { ...dayToUpdate, waterIntake: newValue }
        });
      }
    } catch (error) {
      console.error("Failed to update water intake:", error);
    }
  };

  const [notificationPermission, setNotificationPermission] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);

  const setupNotifications = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (authLoading) return;

      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      if (token) setFcmToken(token);

      onMessage(messaging, (payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || "/icon-192.png",
          });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }, [authLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    router.prefetch("/ai-chat");
    setTimeout(() => setupNotifications(), 300);
  }, [router, setupNotifications]);

  return (
    <section className="pt-8 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Today's Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/ai-chat")} className="cursor-pointer">
            <Bot className="w-4 h-4 mr-2" />
            Ask AI Coach
          </Button>
        </div>
      </div>
      {/* Streak Counter - Top Priority */}
      <div className="mb-6">
        <StreakCounter 
          workoutStreak={calculateWorkoutStreak()} 
          nutritionStreak={calculateNutritionStreak()} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Workout</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedWorkoutPlan && (
              <div className="text-gray-600 dark:text-gray-300">
                No active workout plan. Create one to get started.
                <div className="mt-4"><Link href="/workout-plan"><Button className="cursor-pointer">Create Workout Plan</Button></Link></div>
              </div>
            )}

            {selectedWorkoutPlan && (<WorkoutTodaySummary plan={selectedWorkoutPlan} onStart={(link) => router.push(link)} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Workouts</div>
                <div className="text-xl font-semibold">{workoutStats?.totalWorkouts ?? selectedWorkoutPlan?.stats?.totalWorkouts ?? 0}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Avg mins</div>
                <div className="text-xl font-semibold">{workoutStats?.averageWorkoutDuration ?? selectedWorkoutPlan?.stats?.averageWorkoutDuration ?? 0}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Completion</div>
                <div className="text-xl font-semibold">{(workoutStats?.completionRate ?? selectedWorkoutPlan?.stats?.completionRate ?? 0)}%</div>
              </div>
            </div>

            {/* Personal Records */}
            <PersonalRecordsWidget 
              records={selectedWorkoutPlan?.stats?.strongestLifts || []} 
              limit={3}
            />

            {/* Weekly Calendar */}
            {selectedWorkoutPlan && (
              <WeeklyCalendarView 
                weekDays={getCurrentWeekData()} 
                currentDayNumber={currentDayNumber}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Today's Nutrition</CardTitle>
              {selectedDietPlan && (
                <Link href="/diet-plan">
                  <Button variant="ghost" size="sm" className="h-8 text-xs cursor-pointer">
                    View Plans
                  </Button>
                </Link>
              )}
            </div>
            {selectedDietPlan && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedDietPlan.name}
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {!selectedDietPlan && (
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                No active diet plan. Create one to track your nutrition.
                <div className="mt-3">
                  <Link href="/diet-plan">
                    <Button size="sm" className="cursor-pointer">Create Diet Plan</Button>
                  </Link>
                </div>
              </div>
            )}

            {selectedDietPlan && nutritionData && (
              <div className="space-y-4">
                {/* Compact Macro Progress */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle 
                          cx="24" cy="24" r="20" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="none" 
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(nutritionData.current.calories / nutritionData.target.calories, 1))}`}
                          className="text-blue-500 transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold mt-1">{nutritionData.current.calories}</div>
                    <div className="text-[10px] text-gray-500">Calories</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle 
                          cx="24" cy="24" r="20" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="none" 
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(nutritionData.current.protein / nutritionData.target.protein, 1))}`}
                          className="text-green-500 transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold mt-1">{nutritionData.current.protein}g</div>
                    <div className="text-[10px] text-gray-500">Protein</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle 
                          cx="24" cy="24" r="20" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="none" 
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(nutritionData.current.carbs / nutritionData.target.carbs, 1))}`}
                          className="text-orange-500 transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold mt-1">{nutritionData.current.carbs}g</div>
                    <div className="text-[10px] text-gray-500">Carbs</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle 
                          cx="24" cy="24" r="20" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="none" 
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(nutritionData.current.fats / nutritionData.target.fats, 1))}`}
                          className="text-purple-500 transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold mt-1">{nutritionData.current.fats}g</div>
                    <div className="text-[10px] text-gray-500">Fats</div>
                  </div>
                </div>

                {/* Today's Meals - Compact */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Today's Meals</h4>
                  <DietTodaySummary plan={selectedDietPlan} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full cursor-pointer" onClick={() => router.push("/ai-chat")} variant="default">
                <Bot className="w-4 h-4 mr-2" />
                Ask AI Coach
              </Button>
              {selectedWorkoutPlan && (
                <Button className="w-full cursor-pointer" variant="outline" onClick={() => router.push(`/workout-plan/${selectedWorkoutPlan._id}`)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  View Workout Plan
                </Button>
              )}
              {selectedDietPlan && (
                <Button className="w-full cursor-pointer" variant="outline" onClick={() => router.push(`/diet-plan/${selectedDietPlan._id}`)}>
                  Add Meal
                </Button>
              )}
              {!selectedWorkoutPlan && (
                <Button className="w-full cursor-pointer" variant="outline" onClick={() => router.push("/workout-plan")}>
                  Create Workout Plan
                </Button>
              )}
              {!selectedDietPlan && (
                <Button className="w-full cursor-pointer" variant="outline" onClick={() => router.push("/diet-plan")}>
                  Create Diet Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
