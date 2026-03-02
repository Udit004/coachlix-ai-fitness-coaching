// src/ai/graph/graphTools.js
// DynamicStructuredTool wrappers for LangGraph compatibility
//
// Why this file exists:
//   The existing tool classes extend LangChain's plain `Tool` (string-input interface).
//   LangGraph's LLM binding (llm.bindTools) needs proper Zod schemas to generate
//   correct Gemini function declarations so the model understands each parameter.
//   These wrappers keep the existing tool *implementations* unchanged while
//   providing rich Zod schemas for schema-aware binding.

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { toolRegistry } from "../tools/index.js";

/**
 * Build all 6 fitness DynamicStructuredTools.
 *
 * @param {string[]} excludedTools - Names to exclude (e.g. ["nutrition_lookup"]
 *   when Google Search grounding is active and would duplicate that capability).
 * @returns {DynamicStructuredTool[]}
 */
export function createGraphTools(excludedTools = []) {
  const all = [
    // ── 1. nutrition_lookup ─────────────────────────────────────────────────
    new DynamicStructuredTool({
      name: "nutrition_lookup",
      description:
        "Look up detailed nutrition information for a specific food (calories, protein, carbs, fats). " +
        "Use this in TWO situations: " +
        "(1) When the user asks 'how many calories in X' or 'nutrition facts for X'. " +
        "(2) PROACTIVELY, before calling update_diet_plan, whenever you need macro data for a food item " +
        "the user mentioned (e.g. 'paneer tikka', 'dal', 'oats', 'boiled egg'). " +
        "NEVER ask the user to provide calorie or macro numbers — look them up using this tool instead.",
      schema: z.object({
        foodName: z
          .string()
          .describe(
            "Name of the food item (e.g. 'chicken breast', 'brown rice', 'banana')"
          ),
        userId: z
          .string()
          .optional()
          .describe("User ID for personalization (injected automatically)"),
      }),
      func: async ({ foodName, userId }) =>
        toolRegistry.nutrition_lookup({ foodName, userId }),
    }),

    // ── 2. update_workout_plan ───────────────────────────────────────────────
    new DynamicStructuredTool({
      name: "update_workout_plan",
      description:
        "Create or update a workout plan for the user. " +
        "Use when the user says 'create a workout plan', 'update my workout', " +
        "'change my exercises', or 'make me a training program'.",
      schema: z.object({
        userId: z.string().describe("User ID (required)"),
        planName: z
          .string()
          .optional()
          .describe("Name of the workout plan (e.g. 'My Strength Plan')"),
        action: z
          .enum(["get", "create", "update"])
          .optional()
          .describe(
            "Action: get (retrieve existing), create (new plan), update (modify)"
          ),
        exercises: z
          .array(
            z.object({
              name: z.string().describe("Exercise name"),
              sets: z.number().optional().describe("Number of sets"),
              reps: z.number().optional().describe("Number of reps"),
              duration: z
                .string()
                .optional()
                .describe("Duration string e.g. '30 seconds'"),
            })
          )
          .optional()
          .describe("List of exercises with sets / reps"),
        duration: z
          .number()
          .optional()
          .describe("Plan duration in weeks"),
        difficulty: z
          .enum(["beginner", "intermediate", "advanced"])
          .optional()
          .describe("Difficulty level"),
        goal: z
          .string()
          .optional()
          .describe(
            "Fitness goal: weight_loss, muscle_gain, endurance, flexibility, maintenance"
          ),
      }),
      func: async (params) => toolRegistry.update_workout_plan(params),
    }),

    // ── 3. calculate_health_metrics ─────────────────────────────────────────
    new DynamicStructuredTool({
      name: "calculate_health_metrics",
      description:
        "Calculate BMI, BMR, TDEE (total daily energy expenditure), or daily calorie needs. " +
        "Use when the user asks 'calculate my BMI', 'what are my health metrics', " +
        "'how many calories should I eat', or 'what is my maintenance calories'.",
      schema: z.object({
        userId: z.string().describe("User ID (required)"),
        action: z
          .enum(["calculate", "get"])
          .optional()
          .describe(
            "calculate: compute fresh metrics from profile; get: retrieve last saved metrics"
          ),
      }),
      func: async (params) => toolRegistry.calculate_health_metrics(params),
    }),

    // ── 4. create_diet_plan ──────────────────────────────────────────────────
    new DynamicStructuredTool({
      name: "create_diet_plan",
      description:
        "Create a new personalised diet / meal plan for the user. " +
        "Use when the user says 'create a diet plan', 'I need a meal plan', " +
        "'make me a diet', 'plan my meals', or 'build a nutrition plan'.",
      schema: z.object({
        userId: z.string().describe("User ID (required)"),
        planName: z
          .string()
          .optional()
          .describe("Friendly name for the plan (e.g. 'Weight Loss Plan')"),
        goal: z
          .string()
          .optional()
          .describe(
            "Goal: weight_loss, muscle_gain, maintenance, cutting, or bulking"
          ),
        targetCalories: z
          .number()
          .optional()
          .describe(
            "Target daily calories (auto-calculated from profile if not provided)"
          ),
        duration: z
          .number()
          .optional()
          .describe("Plan duration in days (default: 7)"),
        dietaryRestrictions: z
          .array(z.string())
          .optional()
          .describe(
            "Restrictions such as ['vegetarian', 'gluten-free', 'dairy-free']"
          ),
      }),
      func: async (params) => toolRegistry.create_diet_plan(params),
    }),

    // ── 5. update_diet_plan ──────────────────────────────────────────────────
    new DynamicStructuredTool({
      name: "update_diet_plan",
      description:
        "Update or modify an existing diet plan. " +
        "IMPORTANT: For any partial update (changing one day, one meal, or one food item), " +
        "always call fetch_details FIRST to get the current plan state, then call this tool. " +
        "Supports: updating plan-level targets, replacing a full day, patching a single meal type, " +
        "adding a new food item to a meal, or removing a food item from a meal.",
      schema: z.object({
        userId: z.string().describe("User ID (required)"),
        planId: z.string().optional().describe("MongoDB plan _id — get this from the 'Plan ID' line in the fetch_details response. ALWAYS pass this when updating."),
        planName: z.string().optional().describe("Plan name fallback — only use if planId is unavailable"),
        action: z.enum(["update"]).describe("Must always be 'update'"),

        // ── Plan-level targets ──────────────────────────────────────────────
        targetCalories: z.number().optional().describe("New daily calorie target"),
        targetProtein: z.number().optional().describe("New daily protein target in grams"),
        targetCarbs: z.number().optional().describe("New daily carbs target in grams"),
        targetFats: z.number().optional().describe("New daily fats target in grams"),
        goal: z.string().optional().describe(
          "Updated goal: weight_loss, muscle_gain, maintenance, cutting, or bulking"
        ),

        // ── Full-day replacement ────────────────────────────────────────────
        updateDay: z
          .object({
            dayNumber: z.number().describe("1-based day index to replace (e.g. 1 for Day 1)"),
            meals: z
              .array(
                z.object({
                  type: z
                    .enum(["Breakfast", "Lunch", "Dinner", "Snacks", "Pre-Workout", "Post-Workout"])
                    .describe("Meal type"),
                  items: z
                    .array(
                      z.object({
                        name: z.string().describe("Food item name"),
                        calories: z.number().describe("Calories in kcal"),
                        protein: z.number().describe("Protein in grams"),
                        carbs: z.number().describe("Carbs in grams"),
                        fats: z.number().describe("Fats in grams"),
                        quantity: z.string().optional().describe("e.g. '1 cup', '200g'"),
                      })
                    )
                    .describe("Food items in this meal"),
                })
              )
              .describe("Complete new meals array for this day (replaces existing meals entirely)"),
            waterIntake: z.number().optional().describe("Water intake in litres"),
            notes: z.string().optional().describe("Notes for this day"),
          })
          .optional()
          .describe(
            "Replace ALL meals for a specific day. Use only when rewriting the whole day. " +
            "For changing just one meal type, use updateMeal instead."
          ),

        // ── Single-meal patch (smart merge) ────────────────────────────────
        updateMeal: z
          .object({
            dayNumber: z.number().describe("1-based day index"),
            mealType: z
              .enum(["Breakfast", "Lunch", "Dinner", "Snacks", "Pre-Workout", "Post-Workout"])
              .describe("Exactly which meal to replace on that day"),
            items: z
              .array(
                z.object({
                  name: z.string().describe("Food item name"),
                  calories: z.number().describe("Calories in kcal"),
                  protein: z.number().describe("Protein in grams"),
                  carbs: z.number().describe("Carbs in grams"),
                  fats: z.number().describe("Fats in grams"),
                  quantity: z.string().optional().describe("e.g. '1 cup', '200g'"),
                })
              )
              .describe("New food items for this meal (replaces only this meal type; other meals on the day are untouched)"),
          })
          .optional()
          .describe(
            "Patch a SINGLE meal type on a specific day without touching other meals. " +
            "Example: change only Lunch on Day 1. This is the preferred operation for partial day updates."
          ),

        // ── Add a food item to an existing meal ────────────────────────────
        addFoodItem: z
          .object({
            dayNumber: z.number().describe("1-based day index"),
            mealType: z
              .enum(["Breakfast", "Lunch", "Dinner", "Snacks", "Pre-Workout", "Post-Workout"])
              .describe("Meal to add the item to"),
            item: z.object({
              name: z.string().describe("Food item name"),
              calories: z.number().describe("Calories in kcal"),
              protein: z.number().describe("Protein in grams"),
              carbs: z.number().describe("Carbs in grams"),
              fats: z.number().describe("Fats in grams"),
              quantity: z.string().optional().describe("e.g. '1 boiled', '50g'"),
            }).describe("The food item to add"),
          })
          .optional()
          .describe(
            "Add a single food item to a specific meal on a specific day. " +
            "Example: add a boiled egg to Breakfast on Day 3."
          ),

        // ── Remove a food item from an existing meal ───────────────────────
        removeFoodItem: z
          .object({
            dayNumber: z.number().describe("1-based day index"),
            mealType: z
              .enum(["Breakfast", "Lunch", "Dinner", "Snacks", "Pre-Workout", "Post-Workout"])
              .describe("Meal to remove the item from"),
            foodName: z.string().describe(
              "Name of the food item to remove (case-insensitive match)"
            ),
          })
          .optional()
          .describe(
            "Remove a specific food item from a meal on a specific day. " +
            "Example: remove rice from Dinner on Day 2."
          ),

        // ── Add a new day ──────────────────────────────────────────────────
        addDay: z
          .object({
            meals: z
              .array(
                z.object({
                  type: z
                    .enum(["Breakfast", "Lunch", "Dinner", "Snacks", "Pre-Workout", "Post-Workout"])
                    .describe("Meal type"),
                  items: z
                    .array(
                      z.object({
                        name: z.string().describe("Food item name"),
                        calories: z.number().describe("Calories in kcal"),
                        protein: z.number().describe("Protein in grams"),
                        carbs: z.number().describe("Carbs in grams"),
                        fats: z.number().describe("Fats in grams"),
                        quantity: z.string().optional().describe("e.g. '1 cup', '200g'"),
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
    }),

    // ── 6. fetch_details ────────────────────────────────────────────────────
    new DynamicStructuredTool({
      name: "fetch_details",
      description:
        "Fetch a detailed breakdown of the user's current diet plan or workout plan. " +
        "Use when the user asks: 'what should I eat today', 'show me my full diet plan', " +
        "'what exercises do I do today', 'show me day 3 of my workout', " +
        "or 'give me my full workout schedule'.",
      schema: z.object({
        userId: z.string().describe("User ID (required)"),
        type: z
          .enum(["diet", "workout"])
          .describe("Whether to fetch diet (meals) or workout (exercises) details"),
        detail: z
          .enum(["today", "full", "specific_day"])
          .describe(
            "today: current day only; full: all days up to 7; specific_day: pass dayNumber too"
          ),
        dayNumber: z
          .number()
          .optional()
          .describe(
            "1-based day index (1–7); only required when detail='specific_day'"
          ),
      }),
      func: async (params) => toolRegistry.fetch_details(params),
    }),
  ];

  if (excludedTools.length === 0) return all;
  return all.filter((t) => !excludedTools.includes(t.name));
}
