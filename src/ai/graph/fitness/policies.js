// src/ai/graph/fitness/policies.js
// Shared routing and execution policies for the fitness graph.

import { QueryType } from "../../reasoning/intentRouter.js";

/** Intents that need no database/vector context. */
const SKIP_RAG_INTENTS = ["greeting", "motivation", "complaint", "feedback"];

/** Intents that need no chat history in prompt. */
const SKIP_HISTORY_INTENTS = [
  "greeting",
  "motivation",
  "complaint",
  "question_general",
];

/** Only these profile fields are injected into personalized prompts. */
const PROFILE_FIELDS_FOR_PROMPT = ["activityLevel", "experience", "fitnessGoal"];

/** Personal tools should not be available on general path. */
const PERSONAL_TOOLS = [
  "update_workout_plan",
  "calculate_health_metrics",
  "create_diet_plan",
  "update_diet_plan",
  "fetch_details",
];

export function shouldSkipRag(intent) {
  if (!intent?.intent) return false;
  const skipForGeneral = intent.intent === "question_general" && !intent.requiresData;
  return SKIP_RAG_INTENTS.includes(intent.intent) || skipForGeneral;
}

export function shouldSkipHistory(intent) {
  if (!intent?.intent) return false;
  return SKIP_HISTORY_INTENTS.includes(intent.intent);
}

export function injectRelevantProfileFields(userContext, profile) {
  if (!userContext || !profile) return userContext;

  const relevantProfile = {};
  for (const field of PROFILE_FIELDS_FOR_PROMPT) {
    if (profile[field]) {
      relevantProfile[field] = profile[field];
    }
  }

  if (Object.keys(relevantProfile).length === 0) return userContext;

  return {
    ...userContext,
    profile: {
      ...userContext.profile,
      ...relevantProfile,
      _profileSummary:
        [
          relevantProfile.fitnessGoal ? `Goal: ${relevantProfile.fitnessGoal}` : null,
          relevantProfile.experience ? `Experience: ${relevantProfile.experience}` : null,
          relevantProfile.activityLevel ? `Activity: ${relevantProfile.activityLevel}` : null,
        ]
          .filter(Boolean)
          .join(" | ") || undefined,
    },
  };
}

function shouldExcludeNutritionLookupForPlanModification(intent, userContext) {
  if (intent?.intent !== "plan_modification") return false;
  const namedFoods = intent.entities?.foods ?? [];
  const preloadedFoods = userContext?.preloadedNutrition ?? [];
  return namedFoods.length > 0 && preloadedFoods.length >= namedFoods.length;
}

function shouldExcludeFetchDetailsForPlanModification(intent, userContext) {
  return intent?.intent === "plan_modification" && !!userContext?._modificationData?.planId;
}

export function getExcludedTools({ enableSearch, queryType, intent, userContext }) {
  const excluded = new Set();

  if (enableSearch) {
    excluded.add("nutrition_lookup");
  }

  if (queryType === QueryType.GENERAL_FITNESS) {
    PERSONAL_TOOLS.forEach((tool) => excluded.add(tool));
  }

  if (shouldExcludeFetchDetailsForPlanModification(intent, userContext)) {
    excluded.add("fetch_details");
  }

  if (shouldExcludeNutritionLookupForPlanModification(intent, userContext)) {
    excluded.add("nutrition_lookup");
  }

  return [...excluded];
}
