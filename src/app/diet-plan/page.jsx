// Server Component — SSR data fetch + delegate rendering to DietPlanClient
import { cookies } from "next/headers";
import DietPlanClient from "@/feature/diet/dietlist/pages/DietPlanListClient";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { DIET_PLAN_KEYS } from "@/feature/diet/dietlist/hooks/useDietPlanListQueries";

export const metadata = {
  title: "Diet Plans",
  description: "Manage your nutrition plans and track your goals",
};

// Must match DietPlanClient's initial queryOptions (sortBy defaults to "newest")
const INITIAL_QUERY_OPTIONS = { sort: "-createdAt" };

export default async function DietPlansPage() {
  const queryClient = new QueryClient();

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (sessionCookie) {
      const user = await verifySessionCookie(sessionCookie);
      if (user?.uid) {
        await connectDB();
        const plans = await DietPlan.find({ userId: user.uid })
          .sort({ createdAt: -1 })
          .lean();
        // Cache in the same shape the API returns so useDietPlans's select() works correctly
        queryClient.setQueryData(DIET_PLAN_KEYS.list(INITIAL_QUERY_OPTIONS), {
          plans: JSON.parse(JSON.stringify(plans)),
        });
      }
    }
  } catch {
    // Not authenticated or any error — client will fetch on mount
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DietPlanClient />
    </HydrationBoundary>
  );
}
