// src/ai/graph/fitness/nodes/retrieveContextNode.js

import { buildSmartContext } from "../../../search/semanticMemoryRetrieval.js";
import { fetchNutritionFromUSDA } from "../../../tools/nutritionTool.js";
import { shouldSkipRag } from "../policies.js";

export async function retrieveContextNode(state) {
  const { userId, originalMessage, intent } = state;
  const t0 = Date.now();

  if (shouldSkipRag(intent)) {
    console.log("[Graph:context] RAG SKIPPED (simple intent - no DB query needed)");
    return {
      userContext: {
        profile: { name: "User" },
        dietPlan: null,
        workoutPlan: null,
        conversationHistory: [],
      },
      flowMetrics: { contextRetrievalTime: 0 },
    };
  }

  console.log("[Graph:context] Retrieving smart context (RAG + MongoDB)...");

  const foodsToFetch =
    intent.intent === "plan_modification" &&
    Array.isArray(intent.entities?.foods) &&
    intent.entities.foods.length > 0
      ? intent.entities.foods
      : [];

  if (foodsToFetch.length > 0) {
    console.log(
      `[Graph:context] Pre-fetching USDA nutrition (parallel with RAG) for: ${foodsToFetch.join(", ")}`
    );
  }

  const [userContext, nutritionResults] = await Promise.all([
    buildSmartContext(userId, originalMessage, intent),
    Promise.all(
      foodsToFetch.map(async (food) => {
        const data = await fetchNutritionFromUSDA(food);
        return data ? { food, ...data } : null;
      })
    ),
  ]);

  const fetched = nutritionResults.filter(Boolean);
  if (fetched.length > 0) {
    userContext.preloadedNutrition = fetched;
    console.log(
      `[Graph:context] USDA pre-fetch done: ${fetched.map((f) => f.food).join(", ")}`
    );
  } else if (foodsToFetch.length > 0) {
    console.log(
      "[Graph:context] USDA pre-fetch returned no results - LLM will use built-in knowledge"
    );
  }

  const elapsed = Date.now() - t0;
  console.log(`[Graph:context] Context ready in ${elapsed} ms`);

  return {
    userContext,
    flowMetrics: { contextRetrievalTime: elapsed },
  };
}
