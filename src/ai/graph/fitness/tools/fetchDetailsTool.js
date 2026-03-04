// src/ai/graph/fitness/tools/fetchDetailsTool.js

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { toolRegistry } from "../../../tools/index.js";

export function createFetchDetailsTool() {
  return new DynamicStructuredTool({
    name: "fetch_details",
    description:
      "Fetch a detailed breakdown of the user's current diet plan or workout plan. " +
      "SKIP this call when Plan ID and current day meals are already provided in the " +
      "PRELOADED PLAN DATA section of the system prompt - use that data directly instead. " +
      "Use this tool when the user asks: 'what should I eat today', 'show me my full diet plan', " +
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
        .describe("1-based day index (1-7); only required when detail='specific_day'"),
    }),
    func: async (params) => toolRegistry.fetch_details(params),
  });
}
