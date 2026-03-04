// src/ai/graph/fitness/tools/calculateHealthMetricsTool.js

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { toolRegistry } from "../../../tools/index.js";

export function createCalculateHealthMetricsTool() {
  return new DynamicStructuredTool({
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
  });
}
