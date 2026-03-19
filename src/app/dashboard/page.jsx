// SSR Server Component — rendered on each request (never statically cached)
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import DashboardClientPage from "@/feature/Dashboard/pages/DashboardClientPage";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import DietPlan from "@/models/DietPlan";
import { verifySessionCookie } from "@/lib/verifyUser";
import { DASHBOARD_KEYS } from "@/feature/Dashboard/hooks/dashboardQueryKeys";

function toPlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

async function getDashboardOverviewSSRData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) {
      return null;
    }

    const user = await verifySessionCookie(sessionCookie);
    if (!user?.uid) {
      return null;
    }

    await connectDB();

    const [workoutPlan, dietPlan] = await Promise.all([
      WorkoutPlan.findOne({ userId: user.uid, isActive: true })
        .select("_id name startDate isActive weeks stats")
        .lean(),
      DietPlan.findOne({ userId: user.uid, isActive: true })
        .select("_id name createdAt isActive targetCalories targetProtein targetCarbs targetFats days")
        .lean(),
    ]);

    return {
      workoutPlan: toPlainObject(workoutPlan || null),
      dietPlan: toPlainObject(dietPlan || null),
      workoutStats: toPlainObject(workoutPlan?.stats || null),
      nutritionStreak: 0,
    };
  } catch (error) {
    console.error("Dashboard SSR hydration failed:", error);
    return null;
  }
}

/**
 * Dashboard page — SSR shell that renders client-side interactive widgets.
 * Authentication is enforced by AuthGuard in the root layout.
 */
export default async function DashboardPage() {
  const queryClient = new QueryClient();
  const dashboardData = await getDashboardOverviewSSRData();

  if (dashboardData) {
    queryClient.setQueryData(DASHBOARD_KEYS.overview(), dashboardData);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <DashboardClientPage />
      </div>
    </HydrationBoundary>
  );
}
