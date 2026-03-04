// src/ai/tools/nutritionTool.js
import { Tool } from "@langchain/core/tools";
import { connectDB } from "../../lib/db";
import User from "../../models/userProfileModel";
import DietPlan from "../../models/DietPlan";

/**
 * Standalone USDA FoodData Central lookup.
 * Exported so retrieveContextNode can pre-fetch nutrition during the RAG phase
 * (before the first LLM call) when food names are known from entity extraction.
 *
 * Returns null when: API key is missing, network error, or no result found.
 *
 * @param {string} query - Food name to look up
 * @returns {Promise<{calories, protein, carbs, fat, fiber, per}|null>}
 */
export async function fetchNutritionFromUSDA(query) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}&pageSize=1&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`USDA API ${res.status}`);

    const data = await res.json();
    const item = data?.foods?.[0];
    if (!item) return null;

    let calories, protein, carbs, fat, fiber, per;

    if (item.labelNutrients) {
      calories = item.labelNutrients?.calories?.value ?? undefined;
      protein  = item.labelNutrients?.protein?.value ?? undefined;
      carbs    = item.labelNutrients?.carbohydrates?.value ?? undefined;
      fat      = item.labelNutrients?.fat?.value ?? undefined;
      fiber    = item.labelNutrients?.fiber?.value ?? undefined;
      per      = item.servingSize && item.servingSizeUnit
        ? `${item.servingSize}${item.servingSizeUnit}`
        : 'per serving';
    }

    if (calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      const nutrients = item.foodNutrients || [];
      const byNumber  = (n) => nutrients.find((x) => x.nutrientNumber === n || x.nutrientId === n);
      calories = calories ?? byNumber('208')?.value;
      protein  = protein  ?? byNumber('203')?.value;
      carbs    = carbs    ?? byNumber('205')?.value;
      fat      = fat      ?? byNumber('204')?.value;
      fiber    = fiber    ?? byNumber('291')?.value;
      per      = per || 'per 100g';
    }

    if (calories === undefined && protein === undefined && carbs === undefined && fat === undefined) {
      return null;
    }

    return { calories, protein, carbs, fat, fiber: fiber ?? 0, per };
  } catch (err) {
    console.error('[fetchNutritionFromUSDA] Error:', err.message);
    return null;
  }
}

/**
 * Enhanced tool for looking up nutritional information with user context
 */
export class NutritionLookupTool extends Tool {
  name = "nutrition_lookup";
  description =
    "Get food nutrition info. Input: foodName or JSON with foodName and userId. Returns calories, protein, carbs, fats.";

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

      let response = "";
      // Reuse the shared USDA fetch utility
      const nutritionInfo = await fetchNutritionFromUSDA(foodInput);

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
        const apiKey = process.env.USDA_API_KEY;
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
