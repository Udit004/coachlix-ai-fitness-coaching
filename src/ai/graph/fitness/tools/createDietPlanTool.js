// src/ai/graph/fitness/tools/createDietPlanTool.js

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { toolRegistry } from "../../../tools/index.js";

export function createCreateDietPlanTool() {
  return new DynamicStructuredTool({
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
      duration: z.number().optional().describe("Plan duration in days (default: 7)"),
      dietaryRestrictions: z
        .array(z.string())
        .optional()
        .describe(
          "Restrictions such as ['vegetarian', 'gluten-free', 'dairy-free']"
        ),
    }),
    func: async (params) => toolRegistry.create_diet_plan(params),
  });
}
