// src/ai/graph/fitness/tools/updateDietPlanTool.js

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { toolRegistry } from "../../../tools/index.js";

export function createUpdateDietPlanTool() {
  return new DynamicStructuredTool({
    name: "update_diet_plan",
    description:
      "Update or modify an existing diet plan. " +
      "IMPORTANT: If Plan ID and current day meals are already provided in the PRELOADED PLAN DATA " +
      "section of the system prompt, use that planId directly - do NOT call fetch_details first. " +
      "Only call fetch_details before this tool when no Plan ID is available in the system prompt. " +
      "Supports: updating plan-level targets, replacing a full day, patching a single meal type, " +
      "adding a new food item to a meal, or removing a food item from a meal.",
    schema: z.object({
      userId: z.string().describe("User ID (required)"),
      planId: z
        .string()
        .optional()
        .describe(
          "MongoDB plan _id - get this from the 'Plan ID' line in the fetch_details response. ALWAYS pass this when updating."
        ),
      planName: z
        .string()
        .optional()
        .describe("Plan name fallback - only use if planId is unavailable"),
      action: z.enum(["update"]).describe("Must always be 'update'"),

      targetCalories: z.number().optional().describe("New daily calorie target"),
      targetProtein: z
        .number()
        .optional()
        .describe("New daily protein target in grams"),
      targetCarbs: z.number().optional().describe("New daily carbs target in grams"),
      targetFats: z.number().optional().describe("New daily fats target in grams"),
      goal: z
        .string()
        .optional()
        .describe(
          "Updated goal: weight_loss, muscle_gain, maintenance, cutting, or bulking"
        ),

      updateDay: z
        .object({
          dayNumber: z
            .number()
            .describe("1-based day index to replace (e.g. 1 for Day 1)"),
          meals: z
            .array(
              z.object({
                type: z
                  .enum([
                    "Breakfast",
                    "Lunch",
                    "Dinner",
                    "Snacks",
                    "Pre-Workout",
                    "Post-Workout",
                  ])
                  .describe("Meal type"),
                items: z
                  .array(
                    z.object({
                      name: z.string().describe("Food item name"),
                      calories: z.number().describe("Calories in kcal"),
                      protein: z.number().describe("Protein in grams"),
                      carbs: z.number().describe("Carbs in grams"),
                      fats: z.number().describe("Fats in grams"),
                      quantity: z
                        .string()
                        .optional()
                        .describe("e.g. '1 cup', '200g'"),
                    })
                  )
                  .describe("Food items in this meal"),
              })
            )
            .describe(
              "Complete new meals array for this day (replaces existing meals entirely)"
            ),
          waterIntake: z.number().optional().describe("Water intake in litres"),
          notes: z.string().optional().describe("Notes for this day"),
        })
        .optional()
        .describe(
          "Replace ALL meals for a specific day. Use only when rewriting the whole day. " +
            "For changing just one meal type, use updateMeal instead."
        ),

      updateMeal: z
        .object({
          dayNumber: z.number().describe("1-based day index"),
          mealType: z
            .enum([
              "Breakfast",
              "Lunch",
              "Dinner",
              "Snacks",
              "Pre-Workout",
              "Post-Workout",
            ])
            .describe("Exactly which meal to replace on that day"),
          items: z
            .array(
              z.object({
                name: z.string().describe("Food item name"),
                calories: z.number().describe("Calories in kcal"),
                protein: z.number().describe("Protein in grams"),
                carbs: z.number().describe("Carbs in grams"),
                fats: z.number().describe("Fats in grams"),
                quantity: z
                  .string()
                  .optional()
                  .describe("e.g. '1 cup', '200g'"),
              })
            )
            .describe(
              "New food items for this meal (replaces only this meal type; other meals on the day are untouched)"
            ),
        })
        .optional()
        .describe(
          "Patch a SINGLE meal type on a specific day without touching other meals. " +
            "Example: change only Lunch on Day 1. This is the preferred operation for partial day updates."
        ),

      addFoodItem: z
        .object({
          dayNumber: z.number().describe("1-based day index"),
          mealType: z
            .enum([
              "Breakfast",
              "Lunch",
              "Dinner",
              "Snacks",
              "Pre-Workout",
              "Post-Workout",
            ])
            .describe("Meal to add the item to"),
          item: z
            .object({
              name: z.string().describe("Food item name"),
              calories: z.number().describe("Calories in kcal"),
              protein: z.number().describe("Protein in grams"),
              carbs: z.number().describe("Carbs in grams"),
              fats: z.number().describe("Fats in grams"),
              quantity: z
                .string()
                .optional()
                .describe("e.g. '1 boiled', '50g'"),
            })
            .describe("The food item to add"),
        })
        .optional()
        .describe(
          "Add a single food item to a specific meal on a specific day. " +
            "Example: add a boiled egg to Breakfast on Day 3."
        ),

      removeFoodItem: z
        .object({
          dayNumber: z.number().describe("1-based day index"),
          mealType: z
            .enum([
              "Breakfast",
              "Lunch",
              "Dinner",
              "Snacks",
              "Pre-Workout",
              "Post-Workout",
            ])
            .describe("Meal to remove the item from"),
          foodName: z
            .string()
            .describe("Name of the food item to remove (case-insensitive match)"),
        })
        .optional()
        .describe(
          "Remove a specific food item from a meal on a specific day. " +
            "Example: remove rice from Dinner on Day 2."
        ),

      addDay: z
        .object({
          meals: z
            .array(
              z.object({
                type: z
                  .enum([
                    "Breakfast",
                    "Lunch",
                    "Dinner",
                    "Snacks",
                    "Pre-Workout",
                    "Post-Workout",
                  ])
                  .describe("Meal type"),
                items: z
                  .array(
                    z.object({
                      name: z.string().describe("Food item name"),
                      calories: z.number().describe("Calories in kcal"),
                      protein: z.number().describe("Protein in grams"),
                      carbs: z.number().describe("Carbs in grams"),
                      fats: z.number().describe("Fats in grams"),
                      quantity: z
                        .string()
                        .optional()
                        .describe("e.g. '1 cup', '200g'"),
                    })
                  )
                  .describe("Food items in this meal"),
              })
            )
            .optional()
            .describe("Meals for the new day"),
          waterIntake: z.number().optional().describe("Water intake in litres"),
          notes: z.string().optional().describe("Notes for the new day"),
        })
        .optional()
        .describe("Append a brand-new day to the end of the plan"),
    }),
    func: async (params) => toolRegistry.update_diet_plan(params),
  });
}
