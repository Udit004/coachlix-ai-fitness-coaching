// lib/tools.js
import { Tool } from "@langchain/core/tools";
import { connectDB } from "./db";
import mongoose from "mongoose";
import axios from "axios";

/**
 * Tool for looking up nutritional information for foods
 */
export class NutritionLookupTool extends Tool {
  name = "nutrition_lookup";
  description = "Look up nutritional information for foods including calories, protein, carbs, and fats. Input should be a food name or description.";

  async _call(foodInput) {
    try {
      // You can integrate with a nutrition API like Spoonacular or USDA
      // For now, we'll use a simple mock response
      // Replace this with actual API integration
      
      const mockNutritionData = {
        "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6, per: "100g" },
        "brown rice": { calories: 112, protein: 2.3, carbs: 23, fat: 0.9, per: "100g" },
        "banana": { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, per: "medium banana" },
        "salmon": { calories: 208, protein: 22, carbs: 0, fat: 12, per: "100g" },
        "oatmeal": { calories: 68, protein: 2.4, carbs: 12, fat: 1.4, per: "100g" },
      };

      const normalizedInput = foodInput.toLowerCase();
      const nutritionInfo = mockNutritionData[normalizedInput];

      if (nutritionInfo) {
        return `${foodInput}: ${nutritionInfo.calories} calories, ${nutritionInfo.protein}g protein, ${nutritionInfo.carbs}g carbs, ${nutritionInfo.fat}g fat (per ${nutritionInfo.per})`;
      }

      // If not found in mock data, return a helpful message
      return `I don't have specific nutritional data for "${foodInput}" in my database. I recommend checking a nutrition app like MyFitnessPal or consulting with a nutritionist for accurate information.`;
      
    } catch (error) {
      console.error("Error in nutrition lookup:", error);
      return `Sorry, I couldn't look up nutritional information for "${foodInput}" right now. Please try again later.`;
    }
  }
}

/**
 * Tool for updating user workout plans in the database
 */
export class UpdateWorkoutPlanTool extends Tool {
  name = "update_workout_plan";
  description = "Update or create a workout plan for the user in the database. Input should be a JSON string with userId, planName, exercises, and duration.";

  async _call(planInput) {
    try {
      const planData = JSON.parse(planInput);
      const { userId, planName, exercises, duration, difficulty, notes } = planData;

      if (!userId || !planName) {
        return "Error: userId and planName are required to update workout plan.";
      }

      await connectDB();
      
      // Define or import your WorkoutPlan model
      const WorkoutPlan = mongoose.models.WorkoutPlan || mongoose.model('WorkoutPlan', new mongoose.Schema({
        userId: { type: String, required: true },
        planName: { type: String, required: true },
        exercises: [{ 
          name: String, 
          sets: Number, 
          reps: String, 
          weight: String,
          notes: String 
        }],
        duration: String,
        difficulty: String,
        notes: String,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }));

      // Update or create workout plan
      const workoutPlan = await WorkoutPlan.findOneAndUpdate(
        { userId, planName },
        {
          exercises: exercises || [],
          duration: duration || "Unknown",
          difficulty: difficulty || "Beginner",
          notes: notes || "",
          updatedAt: new Date()
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true 
        }
      );

      return `Successfully updated workout plan "${planName}" for user. Plan includes ${exercises?.length || 0} exercises with ${duration || 'flexible'} duration.`;
      
    } catch (error) {
      console.error("Error updating workout plan:", error);
      return `Error updating workout plan: ${error.message}`;
    }
  }
}

/**
 * Tool for calculating BMI and basic health metrics
 */
export class HealthMetricsTool extends Tool {
  name = "calculate_health_metrics";
  description = "Calculate BMI, BMR, and daily calorie needs. Input should be a JSON string with weight (kg), height (cm), age, gender, and activityLevel.";

  async _call(metricsInput) {
    try {
      const data = JSON.parse(metricsInput);
      const { weight, height, age, gender, activityLevel } = data;

      if (!weight || !height || !age) {
        return "Error: weight (kg), height (cm), and age are required for health calculations.";
      }

      // Calculate BMI
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      
      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr;
      if (gender?.toLowerCase() === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      }

      // Calculate daily calories based on activity level
      const activityMultipliers = {
        'sedentary': 1.2,
        'lightly active': 1.375,
        'moderately active': 1.55,
        'very active': 1.725,
        'extra active': 1.9
      };

      const multiplier = activityMultipliers[activityLevel?.toLowerCase()] || 1.375;
      const dailyCalories = Math.round(bmr * multiplier);

      // BMI categories
      let bmiCategory;
      if (bmi < 18.5) bmiCategory = "Underweight";
      else if (bmi < 25) bmiCategory = "Normal weight";
      else if (bmi < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obese";

      return `Health Metrics:
• BMI: ${bmi.toFixed(1)} (${bmiCategory})
• BMR: ${Math.round(bmr)} calories/day
• Daily Calorie Needs: ${dailyCalories} calories/day (${activityLevel || 'lightly active'})
• Recommended for weight loss: ${Math.round(dailyCalories * 0.8)} calories/day
• Recommended for muscle gain: ${Math.round(dailyCalories * 1.1)} calories/day`;

    } catch (error) {
      console.error("Error calculating health metrics:", error);
      return `Error calculating health metrics: ${error.message}`;
    }
  }
}

/**
 * Tool for tracking user progress
 */
export class ProgressTrackingTool extends Tool {
  name = "track_progress";
  description = "Track user's fitness progress including weight, measurements, or workout performance. Input should be a JSON string with userId, type (weight/measurement/workout), value, and date.";

  async _call(progressInput) {
    try {
      const data = JSON.parse(progressInput);
      const { userId, type, value, date, notes } = data;

      if (!userId || !type || !value) {
        return "Error: userId, type, and value are required for progress tracking.";
      }

      await connectDB();

      // Define or import your Progress model
      const Progress = mongoose.models.Progress || mongoose.model('Progress', new mongoose.Schema({
        userId: { type: String, required: true },
        type: { type: String, required: true }, // weight, measurement, workout
        value: { type: mongoose.Schema.Types.Mixed, required: true },
        date: { type: Date, default: Date.now },
        notes: String,
        createdAt: { type: Date, default: Date.now }
      }));

      const progressEntry = new Progress({
        userId,
        type,
        value,
        date: date ? new Date(date) : new Date(),
        notes: notes || ""
      });

      await progressEntry.save();

      return `Progress tracked successfully! Added ${type} entry: ${value} on ${new Date(progressEntry.date).toLocaleDateString()}`;
      
    } catch (error) {
      console.error("Error tracking progress:", error);
      return `Error tracking progress: ${error.message}`;
    }
  }
}

/**
 * Get all available tools for the LangChain agent
 * @returns {Array} Array of tool instances
 */
export function getFitnessTools() {
  return [
    new NutritionLookupTool(),
    new UpdateWorkoutPlanTool(),
    new HealthMetricsTool(),
    new ProgressTrackingTool()
  ];
}