// src/ai/reasoning/intentRouter.js
// Lightweight Query Router — classifies every incoming message into one of
// three execution paths BEFORE the full LangGraph pipeline is entered.
//
// QueryType definitions:
//   GREETING          — short social messages; bypass LLM entirely (<200 ms)
//   GENERAL_FITNESS   — fitness/health questions that don't need user data;
//                       call LLM with a minimal, profile-free prompt (~1.5 s)
//   PERSONALIZED_FITNESS — questions that need the user's goals, experience
//                       or activity level; full profile-aware path (~2 s)
//
// detectIntent(message, classifiedIntent?) is the single exported function.
// It accepts the raw message and optionally the output of the existing V2
// classifier so the two systems stay in sync without double-work.

// ─── QueryType enum ────────────────────────────────────────────────────────────

export const QueryType = {
  GREETING: "GREETING",
  GENERAL_FITNESS: "GENERAL_FITNESS",
  PERSONALIZED_FITNESS: "PERSONALIZED_FITNESS",
};

// ─── Greeting detection ────────────────────────────────────────────────────────

/**
 * Regex patterns that unambiguously identify social openers / small-talk.
 * Kept intentionally strict: a false-positive here means a fitness question
 * would silently skip the LLM, which is worse than a false-negative.
 */
const GREETING_PATTERNS = [
  /^(hi|hello|hey|sup|yo|hola|howdy|heyy+|heya|hii+)[\s!.]*$/i,
  /^good\s+(morning|afternoon|evening|night)[\s!.]*$/i,
  /^(hi|hey|hello)\s+(there|coach|everyone|all)[\s!.]*$/i,
  /^how\s+are\s+you[\s?!.]*$/i,
  /^how\s+(r|are)\s+(u|you)\s+doing[\s?!.]*$/i,
  /^what'?s\s*up[\s?!.]*$/i,
  /^(greetings|namaste|salut|ola)[\s!.]*$/i,
  /^(good\s+to\s+(see|meet)\s+you|nice\s+to\s+meet\s+you)[\s!.]*$/i,
];

/**
 * V2 intent names that map to GREETING regardless of pattern match.
 * Allows the existing rule-based classifier to remain authoritative.
 */
const GREETING_V2_INTENTS = new Set(["greeting"]);

// ─── Personalized intent mapping ───────────────────────────────────────────────

/**
 * Intents that are ALWAYS personalized — they inherently operate on the user's
 * own stored data (plans, metrics, history) regardless of how the message is
 * phrased. Always route to PERSONALIZED_FITNESS.
 */
const ALWAYS_PERSONALIZED_INTENTS = new Set([
  "plan_request",       // "create a workout plan for me"
  "plan_modification",  // "change my lunch to something lighter"
  "progress_tracking",  // "how is my progress?"
  "health_metrics",     // "calculate my BMI"
  "question_specific",  // "what should I eat today?"
  "progress_update",
]);

/**
 * Intents that are SOMETIMES personalized and sometimes general.
 * Require a secondary personal-signal check to decide.
 *
 *   nutrition_inquiry  "how many calories in a banana?" → GENERAL  (factual lookup)
 *                      "how many calories should I eat?" → PERSONAL (goal-based)
 *   workout_inquiry    "how to do a squat?"              → GENERAL  (technique)
 *                      "show me my workout plan"          → PERSONAL (user's data)
 *   supplement_inquiry "is creatine effective?"           → GENERAL  (factual)
 *                      "what supplements suit my goal?"   → PERSONAL (goal-based)
 */
const CONTEXT_DEPENDENT_INTENTS = new Set([
  "nutrition_inquiry",
  "workout_inquiry",
  "supplement_inquiry",
  "exercise_technique",
  "food_comparison",
  "recipe_request",
]);

/**
 * Patterns that signal the user is asking about THEIR OWN data or goals.
 * A match here on a context-dependent intent → PERSONALIZED_FITNESS.
 */
const PERSONAL_SIGNAL_PATTERNS = [
  /\bmy\b/i,                                                     // my goal, my plan, my diet
  /\bfor me\b/i,                                                 // recommend for me
  /\bbased on my\b/i,
  /\bfor my (goal|body|weight|fitness|health|plan)\b/i,
  /\bwhat should i (eat|have|take|consume|drink)\b/i,
  /\bhow (much|many) should i (eat|take|consume|drink|have)\b/i,
  /\bhow many calories should i\b/i,
  /\bsuitable for me\b/i,
  /\bi need to (lose|gain|build|burn)\b/i,
  /\brecommend(ation)? for me\b/i,
];

/** Returns true if the message contains any personal-ownership signal. */
function hasPersonalSignal(message) {
  return PERSONAL_SIGNAL_PATTERNS.some((re) => re.test(message));
}

// ─── Template responses ────────────────────────────────────────────────────────

/**
 * Canned greeting replies — chosen at random to avoid a robotic single answer.
 * These are returned directly; the LLM is never called.
 */
const GREETING_TEMPLATES = [
  "Hey there! I'm doing great, thanks for asking. How can I help with your fitness today?",
  "Hi! I'm here and ready to help. What fitness goal can I support you with today?",
  "Hello! Great to see you. Ready to crush your fitness goals? What's on your mind?",
  "Hey! I'm doing well, thanks! Whether it's workouts, nutrition, or progress tracking — I've got you. What would you like to work on?",
  "Hi there! I'm your AI fitness coach, and I'm here to help. What can I do for you today?",
];

/**
 * Returns a deterministic-ish template based on message content so the same
 * greeting doesn't always map to the same reply.
 *
 * @param {string} message
 * @returns {string}
 */
export function getGreetingResponse(message) {
  const idx = message.length % GREETING_TEMPLATES.length;
  return GREETING_TEMPLATES[idx];
}

// ─── Core routing function ─────────────────────────────────────────────────────

/**
 * Classify a message into one of the three routing tiers.
 *
 * @param {string}  message          - Raw user message.
 * @param {Object}  [classifiedIntent] - Optional result from analyzeIntent() /
 *                                      IntentClassifierV2.  When provided its
 *                                      `.intent` field is used as the primary
 *                                      signal; pattern matching acts as a
 *                                      fallback / sanity check.
 * @returns {{ queryType: string, templateResponse?: string }}
 *   - queryType:        One of QueryType.*
 *   - templateResponse: Pre-built reply string (only for GREETING)
 */
export function detectIntent(message, classifiedIntent = null) {
  if (!message || typeof message !== "string") {
    return { queryType: QueryType.GENERAL_FITNESS };
  }

  const trimmed = message.trim();

  // ── 1. V2 classifier signal (highest priority) ───────────────────────────
  if (classifiedIntent?.intent) {
    const v2Intent = classifiedIntent.intent;

    // Greetings bypass LLM entirely
    if (GREETING_V2_INTENTS.has(v2Intent)) {
      return {
        queryType: QueryType.GREETING,
        templateResponse: getGreetingResponse(trimmed),
      };
    }

    // Always-personalized: need user profile regardless of message wording
    if (ALWAYS_PERSONALIZED_INTENTS.has(v2Intent)) {
      return { queryType: QueryType.PERSONALIZED_FITNESS };
    }

    // Context-dependent: personalized ONLY when the message refers to the
    // user's own data/goals — otherwise treat as a general factual query.
    if (CONTEXT_DEPENDENT_INTENTS.has(v2Intent)) {
      return {
        queryType: hasPersonalSignal(trimmed)
          ? QueryType.PERSONALIZED_FITNESS
          : QueryType.GENERAL_FITNESS,
      };
    }

    // motivation / complaint / feedback / question_general / trend_query → general
    return { queryType: QueryType.GENERAL_FITNESS };
  }

  // ── 2. Lightweight pattern-only fallback (no V2 result available) ─────────
  const isGreeting = GREETING_PATTERNS.some((re) => re.test(trimmed));
  if (isGreeting) {
    return {
      queryType: QueryType.GREETING,
      templateResponse: getGreetingResponse(trimmed),
    };
  }

  // ── 3. Keyword heuristic for personalized queries ─────────────────────────
  const lower = trimmed.toLowerCase();
  const personalizedKeywords = [
    "my plan", "my diet", "my workout", "my goal", "my progress",
    "my weight", "my bmi", "my calories", "recommend for me",
    "based on my", "for my body", "my fitness", "my health",
    "my routine", "my schedule",
  ];
  if (personalizedKeywords.some((kw) => lower.includes(kw))) {
    return { queryType: QueryType.PERSONALIZED_FITNESS };
  }

  // ── 4. Default: general fitness question ─────────────────────────────────
  return { queryType: QueryType.GENERAL_FITNESS };
}
