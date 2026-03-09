// Server Component — SSR data fetch + delegate rendering to WorkoutPlanClient
import { cookies } from "next/headers";
import WorkoutPlanClient from "./WorkoutPlanClient";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";

export const metadata = {
  title: "Workout Plans",
  description: "Design and track your fitness journey with personalized workout plans",
};

/**
 * Reads the __session cookie set by /api/auth/session, verifies it with
 * Firebase Admin, and queries MongoDB directly — no extra HTTP round-trip,
 * no wait for the client to load a token, instant first paint with real data.
 */
async function fetchInitialWorkoutPlans() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return [];

    const user = await verifySessionCookie(sessionCookie);
    if (!user?.uid) return [];

    await connectDB();
    const plans = await WorkoutPlan.find({ userId: user.uid })
      .sort({ createdAt: -1 })
      .lean();

    // .lean() returns plain objects; JSON round-trip strips non-serializable fields
    return JSON.parse(JSON.stringify(plans));
  } catch {
    // Not authenticated or any error — client will fetch on mount
    return [];
  }
}

export default async function WorkoutPlansPage() {
  const initialPlans = await fetchInitialWorkoutPlans();
  return <WorkoutPlanClient initialPlans={initialPlans} />;
}
