// src/ai/graph/fitness/state.js

import { Annotation } from "@langchain/langgraph";

function addMessages(existing, incoming) {
  const left = Array.isArray(existing) ? existing : existing ? [existing] : [];
  const right = Array.isArray(incoming) ? incoming : incoming ? [incoming] : [];
  return [...left, ...right];
}

function mergeObjects(existing, incoming) {
  return { ...(existing ?? {}), ...(incoming ?? {}) };
}

function appendArray(existing, incoming) {
  return [
    ...(Array.isArray(existing) ? existing : []),
    ...(Array.isArray(incoming) ? incoming : []),
  ];
}

const lastWrite = (_, x) => x;

export const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: addMessages,
    default: () => [],
  }),

  userId: Annotation({ reducer: lastWrite, default: () => "" }),
  originalMessage: Annotation({ reducer: lastWrite, default: () => "" }),
  files: Annotation({ reducer: lastWrite, default: () => null }),
  conversationHistory: Annotation({ reducer: lastWrite, default: () => [] }),
  profile: Annotation({ reducer: lastWrite, default: () => null }),

  intent: Annotation({ reducer: lastWrite, default: () => null }),
  queryType: Annotation({ reducer: lastWrite, default: () => null }),
  needsRag: Annotation({ reducer: lastWrite, default: () => false }),
  greetingResponse: Annotation({ reducer: lastWrite, default: () => "" }),
  userContext: Annotation({ reducer: lastWrite, default: () => null }),
  enableSearch: Annotation({ reducer: lastWrite, default: () => false }),

  toolsUsed: Annotation({ reducer: appendArray, default: () => [] }),
  startTime: Annotation({ reducer: lastWrite, default: () => 0 }),
  flowMetrics: Annotation({ reducer: mergeObjects, default: () => ({}) }),
});
