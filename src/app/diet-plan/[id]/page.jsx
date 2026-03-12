// Server Component — SSR data fetch + delegate rendering to SingleDietPlanClient
import { cookies } from "next/headers";
import SingleDietPlanClient from "@/feature/diet/detailDietPage/pages/SingleDietPlanClient";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { DIET_PLAN_DETAIL_KEYS } from "@/feature/diet/detailDietPage/hooks/useDietPlanDetailQueries";

export const metadata = {
  title: "Diet Plan Details",
  description: "View and manage your diet plan",
};

export default async function SingleDietPlanPage({ params }) {
  const { id } = await params;
  const queryClient = new QueryClient();

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    
    if (sessionCookie) {
      const user = await verifySessionCookie(sessionCookie);
      if (user?.uid) {
        await connectDB();
        
        // Fetch the diet plan
        const plan = await DietPlan.findOne({ 
          _id: id, 
          userId: user.uid 
        }).lean();
        
        if (plan) {
          // Cache the plan data in the same shape the hook expects
          queryClient.setQueryData(
            DIET_PLAN_DETAIL_KEYS.detail(id),
            JSON.parse(JSON.stringify(plan))
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in SSR diet plan page:", error);
    // Continue without cached data; client will fetch
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SingleDietPlanClient planId={id} />
    </HydrationBoundary>
  );
}