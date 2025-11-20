// src/ai/tools/healthMetricsTool.js
import { Tool } from "@langchain/core/tools";
import { connectDB } from "../../lib/db";
import User from "../../models/userProfileModel";

/**
 * Enhanced health metrics tool with user context
 */
export class HealthMetricsTool extends Tool {
  name = "calculate_health_metrics";
  description =
    "Calculate BMI, BMR, calories, and macros. Input: JSON with userId (required). Returns formatted health metrics.";

  async _call(metricsInput) {
    try {
      const data = JSON.parse(metricsInput);
      const { userId, weight, height, age, gender, activityLevel, goal } = data;

      if (!userId) {
        return "Error: userId is required for health calculations.";
      }

      await connectDB();

      // Get user profile data
      const user = await User.findOne({ firebaseUid: userId }).lean();

      if (!user) {
        return "Error: User profile not found. Please complete your profile first.";
      }

      // Use provided data or fall back to profile data
      const userWeight = weight || user.weight || null;
      const userHeight = height || user.height || null;
      const userAge =
        age ||
        user.age ||
        (user.birthDate ? calculateAge(user.birthDate) : null);
      const userGender = gender || user.gender || null;
      const userActivity = activityLevel || user.activityLevel || "moderately active";
      const userGoal = goal || user.fitnessGoal || "Maintenance";

      if (!userWeight || !userHeight || !userAge) {
        return "Error: weight (kg), height (cm), and age are required for calculations. Please update your profile with this information.";
      }

      if (!userGender) {
        return "Error: gender is required for accurate BMR calculations. Please update your profile with your gender information.";
      }

      // Calculate BMI
      const heightInMeters = userHeight / 100;
      const bmi = userWeight / (heightInMeters * heightInMeters);

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr;
      if (userGender?.toLowerCase() === "male") {
        bmr = 10 * userWeight + 6.25 * userHeight - 5 * userAge + 5;
      } else {
        bmr = 10 * userWeight + 6.25 * userHeight - 5 * userAge - 161;
      }

      // Calculate daily calories based on activity level
      const activityMultipliers = {
        sedentary: 1.2,
        "lightly active": 1.375,
        "moderately active": 1.55,
        "very active": 1.725,
        "extra active": 1.9,
      };

      const multiplier =
        activityMultipliers[userActivity?.toLowerCase()] || 1.55;
      const maintenanceCalories = Math.round(bmr * multiplier);

      // Goal-specific calorie adjustments
      let targetCalories = maintenanceCalories;
      let calorieAdjustment = "";

      if (
        userGoal?.includes("Weight Loss") ||
        userGoal?.includes("weight loss")
      ) {
        targetCalories = Math.round(maintenanceCalories * 0.8); // 20% deficit
        calorieAdjustment = " (20% deficit for weight loss)";
      } else if (
        userGoal?.includes("Muscle Gain") ||
        userGoal?.includes("muscle gain")
      ) {
        targetCalories = Math.round(maintenanceCalories * 1.15); // 15% surplus
        calorieAdjustment = " (15% surplus for muscle gain)";
      }

      // BMI categories
      let bmiCategory;
      if (bmi < 18.5) bmiCategory = "Underweight";
      else if (bmi < 25) bmiCategory = "Normal weight";
      else if (bmi < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obese";

      // Macro recommendations based on goal
      let proteinTarget, carbTarget, fatTarget;
      if (userGoal?.includes("Muscle Gain")) {
        proteinTarget = Math.round(userWeight * 2.2); // 2.2g per kg
        fatTarget = Math.round((targetCalories * 0.25) / 9); // 25% of calories
        carbTarget = Math.round(
          (targetCalories - proteinTarget * 4 - fatTarget * 9) / 4
        ); // Remaining calories
      } else if (userGoal?.includes("Weight Loss")) {
        proteinTarget = Math.round(userWeight * 2.0); // 2g per kg
        fatTarget = Math.round((targetCalories * 0.25) / 9);
        carbTarget = Math.round(
          (targetCalories - proteinTarget * 4 - fatTarget * 9) / 4
        );
      } else {
        proteinTarget = Math.round(userWeight * 1.6); // 1.6g per kg
        fatTarget = Math.round((targetCalories * 0.3) / 9);
        carbTarget = Math.round(
          (targetCalories - proteinTarget * 4 - fatTarget * 9) / 4
        );
      }

      // Compose response
      let response = `Health Metrics for User:\n`;
      response += `• BMI: ${bmi.toFixed(1)} (${bmiCategory})\n`;
      response += `• BMR: ${Math.round(bmr)} kcal/day\n`;
      response += `• Maintenance Calories: ${maintenanceCalories} kcal/day\n`;
      response += `• Target Calories: ${targetCalories} kcal/day${calorieAdjustment}\n`;
      response += `• Macro Targets: Protein ${proteinTarget}g, Carbs ${carbTarget}g, Fat ${fatTarget}g\n`;

      return response;
    } catch (error) {
      console.error("Error calculating health metrics:", error);
      return `Error calculating health metrics: ${error.message}`;
    }
  }
}

// Utility function

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
