// src/ai/graph/fitness/tools/nutritionLookupTool.js

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { toolRegistry } from "../../../tools/index.js";

export function createNutritionLookupTool() {
  return new DynamicStructuredTool({
    name: "nutrition_lookup",
    description:
      "Look up detailed nutrition information for a specific food (calories, protein, carbs, fats). " +
      "Use this in TWO situations: " +
      "(1) When the user asks 'how many calories in X' or 'nutrition facts for X'. " +
      "(2) PROACTIVELY before calling update_diet_plan when you need macro data for a food item " +
      "the user mentioned and it is NOT already listed in the PRELOADED NUTRITION section of the system prompt. " +
      "EXCEPTION: For well-known Indian, Mediterranean, Asian, or other common cuisines use your built-in nutritional knowledge directly. " +
      "Only call this tool for unusual, branded, or region-specific items you are not confident about. " +
      "NEVER ask the user to provide calorie or macro numbers.",
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
  });
}
