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
    "Look up nutritional information for foods including calories, protein, carbs, and fats. Input should be a JSON string with foodName and optionally userId for personalized advice.";

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

      // Enhanced nutrition database (you can integrate with real API)
      const nutritionDatabase = {
        "chicken breast": {
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          per: "100g",
          fiber: 0,
        },
        "brown rice": {
          calories: 112,
          protein: 2.3,
          carbs: 23,
          fat: 0.9,
          per: "100g",
          fiber: 1.8,
        },
        banana: {
          calories: 89,
          protein: 1.1,
          carbs: 23,
          fat: 0.3,
          per: "medium banana",
          fiber: 2.6,
        },
        salmon: {
          calories: 208,
          protein: 22,
          carbs: 0,
          fat: 12,
          per: "100g",
          fiber: 0,
        },
        oatmeal: {
          calories: 68,
          protein: 2.4,
          carbs: 12,
          fat: 1.4,
          per: "100g",
          fiber: 1.7,
        },
        eggs: {
          calories: 155,
          protein: 13,
          carbs: 1.1,
          fat: 11,
          per: "2 large eggs",
          fiber: 0,
        },
        "greek yogurt": {
          calories: 100,
          protein: 17,
          carbs: 6,
          fat: 0.4,
          per: "170g container",
          fiber: 0,
        },
        almonds: {
          calories: 161,
          protein: 6,
          carbs: 6,
          fat: 14,
          per: "28g (24 nuts)",
          fiber: 3.5,
        },
        "sweet potato": {
          calories: 112,
          protein: 2,
          carbs: 26,
          fat: 0.1,
          per: "medium potato",
          fiber: 3.9,
        },
        broccoli: {
          calories: 34,
          protein: 2.8,
          carbs: 7,
          fat: 0.4,
          per: "100g",
          fiber: 2.6,
        },
        quinoa: {
          calories: 222,
          protein: 8,
          carbs: 39,
          fat: 3.6,
          per: "100g cooked",
          fiber: 2.8,
        },
        avocado: {
          calories: 234,
          protein: 3,
          carbs: 12,
          fat: 21,
          per: "medium avocado",
          fiber: 10,
        },
      };

      const normalizedInput = foodInput.toLowerCase().trim();
      const nutritionInfo = nutritionDatabase[normalizedInput];

      let response = "";

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
        response = `I don't have specific nutritional data for "${foodInput}" in my database. I recommend checking a nutrition app like MyFitnessPal or consulting with a nutritionist for accurate information.`;
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
    "Update or create a workout plan for the user. Input should be a JSON string with userId, planName, exercises, duration, and goal. Can also retrieve existing plans for reference.";

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
 * Enhanced health metrics tool with user context
 */
export class HealthMetricsTool extends Tool {
  name = "calculate_health_metrics";
  description =
    "Calculate BMI, BMR, and daily calorie needs. Input should be a JSON string with userId (required) and optionally weight, height, age, gender, activityLevel. Will use stored profile data if available.";

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
    new HealthMetricsTool(),
  ];
}
