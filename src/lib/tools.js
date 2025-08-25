// lib/tools.js - Enhanced Tools with User Context Awareness
import { Tool } from "@langchain/core/tools";
import { connectDB } from "./db";
import mongoose from "mongoose";
import User from "../models/userProfileModel";
import DietPlan from "../models/DietPlan";
import WorkoutPlan from "../models/WorkoutPlan";

/**
 * Enhanced tool for looking up nutritional information with user context
 */
export class NutritionLookupTool extends Tool {
  name = "nutrition_lookup";
  description =
    "CRITICAL: Use this tool whenever a user asks about food nutrition, calories, macros, or dietary information. Input should be a JSON string with foodName and optionally userId for personalized advice. Returns detailed nutritional information including calories, protein, carbs, fats, and personalized recommendations based on their goals.";

  async _call(input) {
    try {
      let foodInput, userId;

      // Try to parse as JSON first for enhanced functionality
      try {
        const parsed = JSON.parse(input);
        foodInput = parsed.foodName || parsed.food || input;
        userId = parsed.userId;
      } catch {
        // Fallback to simple string input
        foodInput = input;
      }

      // Use USDA FoodData Central API when available
      const apiKey = process.env.USDA_API_KEY;
      let response = "";

      async function fetchFromUSDA(query) {
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}&pageSize=1&query=${encodeURIComponent(query)}`;
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          throw new Error(`USDA API error: ${res.status}`);
        }
        const data = await res.json();
        const item = data?.foods?.[0];
        if (!item) return null;

        // Prefer labelNutrients if present (branded foods), else use foodNutrients
        let calories, protein, carbs, fat, fiber, per;

        if (item.labelNutrients) {
          calories = item.labelNutrients?.calories?.value ?? undefined;
          protein = item.labelNutrients?.protein?.value ?? undefined;
          carbs = item.labelNutrients?.carbohydrates?.value ?? undefined;
          fat = item.labelNutrients?.fat?.value ?? undefined;
          fiber = item.labelNutrients?.fiber?.value ?? undefined;
          per = item.servingSize && item.servingSizeUnit
            ? `${item.servingSize}${item.servingSizeUnit}`
            : "per serving";
        }

        if (calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
          const nutrients = item.foodNutrients || [];
          const byNumber = (n) => nutrients.find((x) => x.nutrientNumber === n || x.nutrientId === n);
          // 208 kcal, 203 protein, 205 carbs, 204 fat, 291 fiber
          calories = calories ?? byNumber("208")?.value;
          protein = protein ?? byNumber("203")?.value;
          carbs = carbs ?? byNumber("205")?.value;
          fat = fat ?? byNumber("204")?.value;
          fiber = fiber ?? byNumber("291")?.value;
          per = per || "per 100g";
        }

        if (calories === undefined && protein === undefined && carbs === undefined && fat === undefined) {
          return null;
        }

        return { calories, protein, carbs, fat, fiber: fiber ?? 0, per };
      }

      let nutritionInfo = null;
      if (apiKey && typeof apiKey === "string" && apiKey.trim() !== "") {
        try {
          nutritionInfo = await fetchFromUSDA(foodInput);
        } catch (err) {
          console.error("Error calling USDA API:", err);
        }
      }

      if (nutritionInfo) {
        response = `${foodInput}:\n• Calories: ${nutritionInfo.calories}\n• Protein: ${nutritionInfo.protein}g\n• Carbs: ${nutritionInfo.carbs}g\n• Fat: ${nutritionInfo.fat}g\n• Fiber: ${nutritionInfo.fiber}g\n• Per: ${nutritionInfo.per}`;

        // Add personalized context if userId provided
        if (userId) {
          try {
            await connectDB();
            const user = await User.findOne({ firebaseUid: userId }).lean();
            const activeDietPlan = await DietPlan.findOne({
              userId,
              isActive: true,
            }).lean();

            if (user && activeDietPlan) {
              response += `\n\nPersonalized Context:`;
              response += `\n• Your daily calorie target: ${activeDietPlan.targetCalories} calories`;
              response += `\n• Your daily protein target: ${activeDietPlan.targetProtein}g`;

              // Calculate how this food fits into their goals
              const caloriePercentage = (
                (nutritionInfo.calories / activeDietPlan.targetCalories) *
                100
              ).toFixed(1);
              const proteinPercentage = (
                (nutritionInfo.protein / activeDietPlan.targetProtein) *
                100
              ).toFixed(1);

              response += `\n• This food provides ${caloriePercentage}% of your daily calories`;
              response += `\n• This food provides ${proteinPercentage}% of your daily protein`;

              if (
                user.fitnessGoal === "Weight Loss" &&
                nutritionInfo.calories > 200
              ) {
                response += `\n• Weight Loss Tip: Consider portion size for calorie management`;
              } else if (
                user.fitnessGoal === "Muscle Gain" &&
                nutritionInfo.protein > 15
              ) {
                response += `\n• Muscle Gain Tip: Great protein source for your goals!`;
              }
            }
          } catch (error) {
            console.error("Error adding personalized context:", error);
            // Continue without personalized context
          }
        }
      } else {
        // Graceful fallback if API key missing or no result
        response = `I couldn't find reliable nutrition data for "${foodInput}" right now.`;
        if (!apiKey) {
          response += `\nNote: USDA API key is not configured on the server.`;
        } else {
          response += `\nTry a more specific name or brand, e.g., "banana raw" or "oatmeal cooked".`;
        }
      }

      return response;
    } catch (error) {
      console.error("Error in nutrition lookup:", error);
      return `Sorry, I couldn't look up nutritional information right now. Please try again later.`;
    }
  }
}

/**
 * Enhanced tool for updating workout plans with context awareness
 */
export class UpdateWorkoutPlanTool extends Tool {
  name = "update_workout_plan";
  description =
    "CRITICAL: Use this tool to create, update, or modify workout plans. Input should be a JSON string. To retrieve existing plans, use: {{\"userId\": \"user_id\", \"action\": \"get\"}}. To create/update plans, include planName, exercises, duration, and goal. This tool can also fetch current workout plans, schedules, and progress details. Use when users want to create new plans or modify existing ones.";

  async _call(planInput) {
    try {
      const planData = JSON.parse(planInput);
      const {
        userId,
        planName,
        exercises,
        duration,
        difficulty,
        notes,
        goal,
        action,
      } = planData;

      if (!userId) {
        return "Error: userId is required to update workout plan.";
      }

      await connectDB();

      // If action is 'get' or 'retrieve', return existing plans
      if (action === "get" || action === "retrieve") {
        const existingPlans = await WorkoutPlan.find({ userId, isActive: true })
          .select("name goal difficulty currentWeek stats")
          .limit(5)
          .lean();

        if (existingPlans.length === 0) {
          return "No active workout plans found for this user.";
        }

        let plansList = "Your Current Workout Plans:\n";
        existingPlans.forEach((plan, index) => {
          plansList += `\n${index + 1}. ${plan.name}`;
          plansList += `\n   Goal: ${plan.goal}`;
          plansList += `\n   Difficulty: ${plan.difficulty}`;
          plansList += `\n   Progress: Week ${plan.currentWeek} | ${
            plan.stats?.completionRate || 0
          }% complete`;
          plansList += `\n   Workouts Done: ${
            plan.stats?.totalWorkouts || 0
          }\n`;
        });

        return plansList;
      }

      // Create or update workout plan
      if (!planName) {
        return "Error: planName is required to create/update workout plan.";
      }

      // Get user context for better plan creation
      const user = await User.findOne({ firebaseUid: userId }).lean();
      const userGoal = goal || user?.fitnessGoal || "General Fitness";
      const userExperience = difficulty || user?.experience || "Beginner";

      // Create workout plan structure
      const workoutPlan = await WorkoutPlan.findOneAndUpdate(
        { userId, name: planName },
        {
          name: planName,
          description: notes || `Personalized ${userGoal} workout plan`,
          goal: userGoal,
          difficulty: userExperience,
          duration: duration || 4, // weeks
          workoutFrequency: 3, // default 3x per week
          weeks: exercises
            ? formatExercisesToWeeks(exercises, userExperience)
            : [],
          targetMuscleGroups: extractTargetMuscles(exercises),
          equipment: extractEquipment(exercises),
          isActive: true,
          createdBy: "ai",
          currentWeek: 1,
          startDate: new Date(),
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      // Update user stats
      if (user) {
        await User.findOneAndUpdate(
          { firebaseUid: userId },
          {
            $addToSet: {
              recentActivities: {
                type: "workout",
                title: `Created workout plan: ${planName}`,
                description: `New ${userGoal} plan with ${userExperience} difficulty`,
                date: new Date(),
              },
            },
          }
        );
      }

      return `Successfully created/updated workout plan "${planName}"!\n\nPlan Details:\n• Goal: ${userGoal}\n• Difficulty: ${userExperience}\n• Duration: ${
        duration || 4
      } weeks\n• Frequency: 3x per week\n\nYour plan includes ${
        exercises?.length || "various"
      } exercises tailored to your experience level. Ready to start your fitness journey!`;
    } catch (error) {
      console.error("Error updating workout plan:", error);
      return `Error updating workout plan: ${error.message}`;
    }
  }
}

/**
 * Tool specifically for retrieving workout plan details and schedules
 */
export class GetWorkoutPlanTool extends Tool {
  name = "get_workout_plan";
  description =
    "CRITICAL: Use this tool whenever a user asks about their workout plans, schedules, exercises, or what they should do for their workouts. Input should be a JSON string with userId (required). Returns detailed information about their current workout plans including schedules, exercises, progress tracking, and weekly breakdowns. ALWAYS use this tool first when users ask about their workout routine.";

  async _call(input) {
    try {
      console.log("🔍 GetWorkoutPlanTool called with input:", input);
      
      const data = JSON.parse(input);
      const { userId } = data;

      if (!userId) {
        console.error("❌ GetWorkoutPlanTool: userId is required");
        return "Error: userId is required to retrieve workout plans.";
      }

      console.log("🔍 GetWorkoutPlanTool: Connecting to database...");
      await connectDB();
      console.log("✅ GetWorkoutPlanTool: Database connected successfully");

      // Get active workout plans
      console.log("🔍 GetWorkoutPlanTool: Searching for workout plans for userId:", userId);
      const activePlans = await WorkoutPlan.find({ userId, isActive: true })
        .select("name goal difficulty currentWeek stats weeks description")
        .lean();
      
      console.log("📊 GetWorkoutPlanTool: Found", activePlans.length, "active plans");

      if (activePlans.length === 0) {
        console.log("📝 GetWorkoutPlanTool: No active plans found, suggesting to create one");
        return "No active workout plans found for this user. Would you like me to help you create one?";
      }

      console.log("📝 GetWorkoutPlanTool: Generating response for", activePlans.length, "plans");
      let response = "Your Current Workout Plans:\n\n";
      
      for (const plan of activePlans) {
        response += `📋 **${plan.name}**\n`;
        response += `Goal: ${plan.goal}\n`;
        response += `Difficulty: ${plan.difficulty}\n`;
        response += `Current Week: ${plan.currentWeek}\n`;
        response += `Progress: ${plan.stats?.completionRate || 0}% complete\n`;
        response += `Total Workouts: ${plan.stats?.totalWorkouts || 0}\n`;
        
        if (plan.description) {
          response += `Description: ${plan.description}\n`;
        }

        // Add weekly schedule if available
        if (plan.weeks && plan.weeks.length > 0) {
          response += `\n📅 **Weekly Schedule:**\n`;
          plan.weeks.forEach((week, weekIndex) => {
            response += `Week ${weekIndex + 1}: ${week.length} workouts\n`;
          });
        }

        response += `\n---\n\n`;
      }

      console.log("✅ GetWorkoutPlanTool: Successfully generated response");
      return response;
    } catch (error) {
      console.error("❌ GetWorkoutPlanTool error:", error);
      return `Error retrieving workout plans: ${error.message}`;
    }
  }
}

/**
 * Enhanced health metrics tool with user context
 */
export class HealthMetricsTool extends Tool {
  name = "calculate_health_metrics";
  description =
    "CRITICAL: Use this tool whenever a user asks about health metrics, BMI, calorie needs, BMR, or macro calculations. Input should be a JSON string with userId (required) and optionally weight, height, age, gender, activityLevel. Will use stored profile data if available. Returns comprehensive health metrics and personalized recommendations.";

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
      const userWeight =
        weight || parseFloat(user.weight?.replace(/[^\d.]/g, "")) || null;
      const userHeight =
        height || parseFloat(user.height?.replace(/[^\d.]/g, "")) || null;
      const userAge =
        age ||
        user.age ||
        (user.birthDate ? calculateAge(user.birthDate) : null);
      const userGender = gender || user.gender || "female"; // default assumption
      const userActivity = activityLevel || "moderately active"; // reasonable default
      const userGoal = goal || user.fitnessGoal || "Maintenance";

      if (!userWeight || !userHeight || !userAge) {
        return "Error: weight (kg), height (cm), and age are required for calculations. Please update your profile with this information.";
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

// Utility functions

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

function formatExercisesToWeeks(exercises, experience) {
  // Dummy implementation: split exercises into weeks based on experience
  if (!Array.isArray(exercises)) return [];
  const weeks = [];
  const perWeek = experience?.toLowerCase() === "beginner" ? 3 : 5;
  for (let i = 0; i < exercises.length; i += perWeek) {
    weeks.push(exercises.slice(i, i + perWeek));
  }
  return weeks;
}

function extractTargetMuscles(exercises) {
  if (!Array.isArray(exercises)) return [];
  const muscles = new Set();
  exercises.forEach((ex) => {
    if (ex.targetMuscle) muscles.add(ex.targetMuscle);
    if (Array.isArray(ex.targetMuscles))
      ex.targetMuscles.forEach((m) => muscles.add(m));
  });
  return Array.from(muscles);
}

function extractEquipment(exercises) {
  if (!Array.isArray(exercises)) return [];
  const equipment = new Set();
  exercises.forEach((ex) => {
    if (ex.equipment) equipment.add(ex.equipment);
    if (Array.isArray(ex.equipments))
      ex.equipments.forEach((eq) => equipment.add(eq));
  });
  return Array.from(equipment);
}

export function getFitnessTools() {
  return [
    new NutritionLookupTool(),
    new UpdateWorkoutPlanTool(),
    new GetWorkoutPlanTool(),
    new HealthMetricsTool(),
  ];
}
