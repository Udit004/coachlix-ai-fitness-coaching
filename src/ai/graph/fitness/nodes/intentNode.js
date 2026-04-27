// src/ai/graph/fitness/nodes/intentNode.js

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { QueryType } from "../../../reasoning/intentRouter.js";
import { createStreamingLLM } from "../../../config/llmconfig.js";
import {
  shouldEnableSearch,
  logSearchUsage,
} from "../../../config/searchGrounding.js";

const INTENT_CLASSIFIER_SYSTEM_PROMPT = `You are an AI fitness assistant.

Step 1: Classify the user's intent into:
- GREETING
- GENERAL_QUERY
- PERSONALIZED_QUERY

Step 2:
- If GREETING -> respond naturally
- If GENERAL_QUERY -> answer normally
- If PERSONALIZED_QUERY -> DO NOT answer, instead mark needs_rag = true

---

RULES:
- If unsure -> GENERAL_QUERY
- Do NOT hallucinate user data
- Keep responses concise and helpful

---

OUTPUT FORMAT (STRICT JSON):

{
  "intent": "...",
  "confidence": 0-1,
  "needs_rag": true/false,
  "response": "string (empty if needs_rag = true)"
}`;

const FALLBACK_RESULT = {
  intent: "GENERAL_QUERY",
  confidence: 0.51,
  needs_rag: false,
  response: "",
};

function extractJsonBlock(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return null;
  }

  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }

  return trimmed.slice(first, last + 1);
}

function parseClassifierOutput(raw) {
  const jsonText = extractJsonBlock(raw);
  if (!jsonText) {
    return FALLBACK_RESULT;
  }

  try {
    const parsed = JSON.parse(jsonText);
    const normalizedIntent = String(parsed.intent || "").trim().toUpperCase();
    const intent =
      normalizedIntent === "GREETING" ||
      normalizedIntent === "GENERAL_QUERY" ||
      normalizedIntent === "PERSONALIZED_QUERY"
        ? normalizedIntent
        : "GENERAL_QUERY";

    const confidence = Number(parsed.confidence);
    const safeConfidence = Number.isFinite(confidence)
      ? Math.max(0, Math.min(1, confidence))
      : 0.51;

    const needsRag = Boolean(parsed.needs_rag);
    const response = typeof parsed.response === "string" ? parsed.response.trim() : "";

    return {
      intent,
      confidence: safeConfidence,
      needs_rag: intent === "PERSONALIZED_QUERY" ? true : needsRag,
      response,
    };
  } catch {
    return FALLBACK_RESULT;
  }
}

function buildDataNeeds(intentName, originalMessage) {
  const lower = (originalMessage || "").toLowerCase();
  const needsDiet = /\b(diet|meal|food|nutrition|calorie|protein|carb|fat)\b/i.test(lower);
  const needsWorkout = /\b(workout|exercise|training|gym|strength|cardio|routine)\b/i.test(
    lower
  );

  if (intentName === "greeting") {
    return {
      needsProfile: false,
      needsDiet: false,
      needsWorkout: false,
      needsHistory: false,
      needsVectorSearch: false,
      priority: "low",
    };
  }

  if (intentName === "question_general") {
    return {
      needsProfile: false,
      needsDiet: false,
      needsWorkout: false,
      needsHistory: false,
      needsVectorSearch: true,
      priority: "low",
    };
  }

  return {
    needsProfile: true,
    needsDiet,
    needsWorkout,
    needsHistory: true,
    needsVectorSearch: true,
    priority: "high",
  };
}

async function classifyWithSmallLlm(originalMessage) {
  const classifierLlm = createStreamingLLM(false, {
    model: process.env.INTENT_CLASSIFIER_MODEL?.trim() || "gemini-2.0-flash-lite",
    temperature: 0,
    maxOutputTokens: 180,
    topP: 0.1,
    topK: 1,
  });

  const output = await classifierLlm.invoke([
    new SystemMessage(INTENT_CLASSIFIER_SYSTEM_PROMPT),
    new HumanMessage(originalMessage || ""),
  ]);

  const rawText =
    typeof output?.content === "string"
      ? output.content
      : JSON.stringify(output?.content ?? "");

  return parseClassifierOutput(rawText);
}

export async function intentNode(state) {
  const { originalMessage } = state;
  const t0 = Date.now();
  let classifierResult;

  try {
    classifierResult = await classifyWithSmallLlm(originalMessage);
  } catch (error) {
    console.warn(
      `[Graph:intent] Small-LLM classifier failed, falling back to GENERAL_QUERY: ${error.message}`
    );
    classifierResult = FALLBACK_RESULT;
  }

  const intentName =
    classifierResult.intent === "GREETING"
      ? "greeting"
      : classifierResult.intent === "PERSONALIZED_QUERY"
        ? "question_specific"
        : "question_general";

  const queryType =
    classifierResult.intent === "GREETING"
      ? QueryType.GREETING
      : classifierResult.intent === "PERSONALIZED_QUERY"
        ? QueryType.PERSONALIZED_FITNESS
        : QueryType.GENERAL_FITNESS;

  const intent = {
    intent: intentName,
    confidence: classifierResult.confidence,
    requiresData: classifierResult.needs_rag,
    dataNeeds: buildDataNeeds(intentName, originalMessage),
    classifierIntent: classifierResult.intent,
    classifierResponse: classifierResult.response,
    version: "llm-small-v1",
  };

  const enableSearch = shouldEnableSearch(intent, originalMessage);
  logSearchUsage(state.userId, intent, enableSearch);

  console.log(
    `[Graph:intent] ${classifierResult.intent}=>${intent.intent} ` +
      `(${(intent.confidence * 100).toFixed(0)}%) ` +
      `queryType=${queryType} ` +
      `needsRag=${classifierResult.needs_rag} ` +
      `priority=${intent.dataNeeds?.priority} ` +
      `search=${enableSearch}`
  );

  return {
    intent,
    queryType,
    needsRag: classifierResult.needs_rag,
    greetingResponse:
      classifierResult.intent === "GREETING" ? classifierResult.response : "",
    enableSearch,
    flowMetrics: { intentClassificationTime: Date.now() - t0 },
  };
}
