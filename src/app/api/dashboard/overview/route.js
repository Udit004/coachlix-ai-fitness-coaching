import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import DietPlan from "@/models/DietPlan";
import { verifySessionCookie } from "@/lib/verifyUser";

export const dynamic = "force-dynamic";

function toPlainObject(document) {
  if (!document) {
    return null;
  }
  return JSON.parse(JSON.stringify(document));
}

async function getAuthenticatedUser(request) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    return await verifySessionCookie(sessionCookie);
  } catch (error) {
    return null;
  }
}

async function getPrimaryWorkoutPlan(userId) {
  const activePlan = await WorkoutPlan.findOne({ userId, isActive: true })
    .select("_id name startDate isActive weeks stats")
    .lean();

  if (activePlan) {
    return activePlan;
  }

  return WorkoutPlan.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("_id name startDate isActive weeks stats")
    .lean();
}

async function getPrimaryDietPlan(userId) {
  const activePlan = await DietPlan.findOne({ userId, isActive: true })
    .select("_id name createdAt isActive targetCalories targetProtein targetCarbs targetFats days")
    .lean();

  if (activePlan) {
    return activePlan;
  }

  return DietPlan.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("_id name createdAt isActive targetCalories targetProtein targetCarbs targetFats days")
    .lean();
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const [workoutPlan, dietPlan] = await Promise.all([
      getPrimaryWorkoutPlan(user.uid),
      getPrimaryDietPlan(user.uid),
    ]);

    const response = NextResponse.json({
      success: true,
      data: {
        workoutPlan: toPlainObject(workoutPlan),
        dietPlan: toPlainObject(dietPlan),
        workoutStats: toPlainObject(workoutPlan?.stats || null),
        nutritionStreak: 0,
      },
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return response;
  } catch (error) {
    console.error("Dashboard overview fetch failed:", error);
    return NextResponse.json(
      { message: "Failed to load dashboard overview", error: error.message },
      { status: 500 }
    );
  }
}
