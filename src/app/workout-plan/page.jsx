// Server Component — SSR data fetch + delegate rendering to WorkoutPlanListClient
import { cookies } from "next/headers";
import WorkoutPlanListClient from "@/feature/workout/planList/pages/WorkoutPlanListClient";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { workoutKeys } from "@/feature/workout/planList/hooks/useWorkoutPlanListQueries";

export const metadata = {
  title: "Workout Plans",
  description: "Design and track your fitness journey with personalized workout plans",
};

// Must match WorkoutPlanListClient's DEFAULT_SORT and initial queryOptions
const INITIAL_SORT = "-createdAt";

export default async function WorkoutPlansPage() {
  const queryClient = new QueryClient();

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (sessionCookie) {
      const user = await verifySessionCookie(sessionCookie);
      if (user?.uid) {
        await connectDB();
        const plans = await WorkoutPlan.find({ userId: user.uid })
          .sort({ createdAt: -1 })
          .lean();
        // Cache in the same shape the API returns so useWorkoutPlans works correctly
        queryClient.setQueryData(
          workoutKeys.list(JSON.stringify({ sort: INITIAL_SORT })),
          { plans: JSON.parse(JSON.stringify(plans)) }
        );
      }
    }
  } catch {
    // Not authenticated or any error — client will fetch on mount
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkoutPlanListClient />
    </HydrationBoundary>
  );
}
