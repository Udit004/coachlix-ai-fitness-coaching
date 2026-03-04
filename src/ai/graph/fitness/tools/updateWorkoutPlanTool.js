// src/ai/graph/fitness/tools/updateWorkoutPlanTool.js

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { toolRegistry } from "../../../tools/index.js";

export function createUpdateWorkoutPlanTool() {
  return new DynamicStructuredTool({
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
      duration: z.number().optional().describe("Plan duration in weeks"),
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
  });
}
