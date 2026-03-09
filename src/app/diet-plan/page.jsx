// Server Component — SSR data fetch + delegate rendering to DietPlanClient
import { cookies } from "next/headers";
import DietPlanClient from "./DietPlanClient";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import DietPlan from "@/models/DietPlan";

export const metadata = {
  title: "Diet Plans",
  description: "Manage your nutrition plans and track your goals",
};

/**
 * Reads the __session cookie set by /api/auth/session, verifies it with
 * Firebase Admin, and queries MongoDB directly — no extra HTTP round-trip,
 * no wait for the client to load a token, instant first paint with real data.
 */
async function fetchInitialDietPlans() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return [];

    const user = await verifySessionCookie(sessionCookie);
    if (!user?.uid) return [];

    await connectDB();
    const plans = await DietPlan.find({ userId: user.uid })
      .sort({ createdAt: -1 })
      .lean();

    // .lean() returns plain objects; stringify+parse strips non-serializable fields
    return JSON.parse(JSON.stringify(plans));
  } catch {
    // Not authenticated or any error — client will fetch on mount
    return [];
  }
}

export default async function DietPlansPage() {
  const initialPlans = await fetchInitialDietPlans();
  return <DietPlanClient initialPlans={initialPlans} />;
}
