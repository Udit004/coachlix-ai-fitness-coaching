// src/ai/graph/fitness/nodes/intentNode.js

import { analyzeIntent } from "../../../reasoning/intentClassifierV2.js";
import { detectIntent } from "../../../reasoning/intentRouter.js";
import {
  shouldEnableSearch,
  logSearchUsage,
} from "../../../config/searchGrounding.js";

export async function intentNode(state) {
  const { originalMessage, profile, conversationHistory } = state;
  const t0 = Date.now();
  const hasDietPlan = Boolean(profile?.hasDietPlan ?? profile?.activeDietPlan);
  const hasWorkoutPlan = Boolean(
    profile?.hasWorkoutPlan ?? profile?.activeWorkoutPlan
  );

  const intent = analyzeIntent(originalMessage, {
    profile,
    conversationHistory,
    hasDietPlan,
    hasWorkoutPlan,
  });

  const { queryType } = detectIntent(originalMessage, intent);

  const enableSearch = shouldEnableSearch(intent, originalMessage);
  logSearchUsage(state.userId, intent, enableSearch);

  console.log(
    `[Graph:intent] ${intent.intent} ` +
      `(${(intent.confidence * 100).toFixed(0)}%) ` +
      `queryType=${queryType} ` +
      `priority=${intent.dataNeeds?.priority} ` +
      `search=${enableSearch}`
  );

  return {
    intent,
    queryType,
    enableSearch,
    flowMetrics: { intentClassificationTime: Date.now() - t0 },
  };
}
