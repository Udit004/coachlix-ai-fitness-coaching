import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DietPlan from "@/models/DietPlan";
import { verifyUserToken } from "@/lib/verifyUser";

export async function GET(request, { params }) {
  try {
    const authHeader =
      request.headers.get("Authorization") ||
      request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const dietPlan = await DietPlan.findOne({
      _id: params.id,
      userId: user.uid,
    });

    if (!dietPlan) {
      return NextResponse.json(
        { message: "Diet plan not found" },
        { status: 404 }
      );
    }

    // Calculate nutrition summary
    const summary = {
      totalDays: dietPlan.days.length,
      averageCalories: dietPlan.getAverageCalories(),
      totalMeals: dietPlan.getTotalMeals(),
      targets: {
        calories: dietPlan.targetCalories,
        protein: dietPlan.targetProtein,
        carbs: dietPlan.targetCarbs,
        fats: dietPlan.targetFats,
      },
      dailyAverages: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      },
    };

    if (dietPlan.days.length > 0) {
      const totals = dietPlan.days.reduce(
        (acc, day) => ({
          calories: acc.calories + day.totalCalories,
          protein: acc.protein + day.totalProtein,
          carbs: acc.carbs + day.totalCarbs,
          fats: acc.fats + day.totalFats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      summary.dailyAverages = {
        calories: Math.round(totals.calories / dietPlan.days.length),
        protein: Math.round(totals.protein / dietPlan.days.length),
        carbs: Math.round(totals.carbs / dietPlan.days.length),
        fats: Math.round(totals.fats / dietPlan.days.length),
      };
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error getting nutrition summary:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
