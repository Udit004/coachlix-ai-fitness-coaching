// src/ai/reasoning/chainOfThought.js
// Multi-Step Reasoning with Chain-of-Thought for Professional Responses
// Implements structured thinking before generating responses

import { createStreamingLLM } from "../config/llmconfig";

/**
 * Chain-of-Thought reasoning steps
 */
export const ReasoningStep = {
  UNDERSTAND: 'understand',
  ANALYZE: 'analyze',
  PLAN: 'plan',
  VALIDATE: 'validate',
  SYNTHESIZE: 'synthesize'
};

/**
 * Generate thinking prompt for Chain-of-Thought reasoning
 * 
 * @param {Object} params - { message, intent, userContext, dataNeeds }
 * @returns {string} - Chain-of-thought prompt
 */
function generateThinkingPrompt({ message, intent, userContext, dataNeeds }) {
  return `You are an expert fitness AI assistant analyzing a user's request. Think step-by-step before responding.

USER CONTEXT:
${userContext.combined || 'No context available'}

USER MESSAGE: "${message}"

DETECTED INTENT: ${intent.intent} (confidence: ${(intent.confidence * 100).toFixed(0)}%)
REQUIRES DATA: ${intent.requiresData ? 'Yes' : 'No'}
PRIORITY: ${dataNeeds.priority}

Think through this request step-by-step using the following framework:

STEP 1 - UNDERSTAND THE REQUEST:
- What is the user really asking for?
- What is the core need or goal behind this message?
- Are there any implicit assumptions or context I should consider?
- Is there any ambiguity that needs clarification?

STEP 2 - ANALYZE AVAILABLE CONTEXT:
- What relevant information do I have about this user?
- What data is available (profile, diet plan, workout plan)?
- What data is missing that I might need?
- How does their fitness goal, dietary preference, or experience level affect my response?

STEP 3 - PLAN THE RESPONSE:
- What approach should I take to answer this?
- Do I need to call any tools/functions?
- What specific information should I include?
- How should I structure my response for clarity?
- What tone is most appropriate (motivational, educational, directive)?

STEP 4 - VALIDATE THE PLAN:
- Does this plan make sense given the user's goals and constraints?
- Are there any safety concerns I should address?
- Am I considering their dietary preferences (e.g., vegetarian, vegan)?
- Am I being culturally appropriate (e.g., Indian vs Western foods)?
- Could my response be misunderstood or cause harm?

STEP 5 - SYNTHESIZE KEY POINTS:
- What are the 3-5 key points I must communicate?
- What is the most important takeaway?
- What action should the user take next?

Provide your thinking in a structured format. Be thorough but concise.`;
}

/**
 * Execute Chain-of-Thought reasoning
 * Uses LLM to think through the problem before responding
 * 
 * @param {Object} params - { message, intent, userContext, dataNeeds }
 * @returns {Promise<Object>} - { thinking, keyPoints, actionPlan, concerns }
 */
export async function executeChainOfThought({ message, intent, userContext, dataNeeds }) {
  const startTime = Date.now();
  
  console.log('\n[ChainOfThought] 🧠 Starting reasoning process...');
  console.log('[ChainOfThought] Intent:', intent.intent);
  console.log('[ChainOfThought] Priority:', dataNeeds.priority);
  
  try {
    // Generate thinking prompt
    const thinkingPrompt = generateThinkingPrompt({ message, intent, userContext, dataNeeds });
    
    // Create LLM instance for reasoning (non-streaming)
    const llm = createStreamingLLM(false);
    
    // Execute reasoning
    const response = await llm.invoke([
      { role: 'system', content: 'You are an AI assistant that thinks step-by-step before responding. Analyze the request carefully and provide structured reasoning.' },
      { role: 'user', content: thinkingPrompt }
    ]);
    
    // Handle different response formats
    let thinking = '';
    if (typeof response === 'string') {
      thinking = response;
    } else if (response.content) {
      thinking = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } else if (response.text) {
      thinking = response.text;
    } else {
      thinking = JSON.stringify(response);
    }
    
    // Parse the thinking to extract structured insights
    const parsed = parseThinkingOutput(thinking);
    
    const reasoningTime = Date.now() - startTime;
    
    console.log('[ChainOfThought] ✅ Reasoning complete in', reasoningTime, 'ms');
    console.log('[ChainOfThought] Key points identified:', parsed.keyPoints.length);
    console.log('[ChainOfThought] Concerns flagged:', parsed.concerns.length);
    
    return {
      rawThinking: thinking,
      ...parsed,
      reasoningTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[ChainOfThought] ❌ Error during reasoning:', error);
    
    // Fallback reasoning
    return {
      rawThinking: 'Error during reasoning process',
      understanding: 'Could not analyze request',
      analysis: 'Limited context available',
      plan: 'Provide basic response',
      validation: 'Unable to validate thoroughly',
      keyPoints: ['Provide helpful response', 'Be encouraging', 'Ask for clarification if needed'],
      actionPlan: 'Respond to user query',
      concerns: ['Error occurred during reasoning'],
      reasoningTime: Date.now() - startTime
    };
  }
}

/**
 * Parse the LLM's thinking output into structured components
 * 
 * @param {string} thinking - Raw thinking output from LLM
 * @returns {Object} - Structured reasoning components
 */
function parseThinkingOutput(thinking) {
  const sections = {
    understanding: '',
    analysis: '',
    plan: '',
    validation: '',
    synthesis: '',
    keyPoints: [],
    actionPlan: '',
    concerns: []
  };
  
  // Ensure thinking is a string
  if (typeof thinking !== 'string') {
    console.warn('[ChainOfThought] Invalid thinking format, using fallback');
    return sections;
  }
  
  // Extract sections using patterns
  const understandMatch = thinking.match(/STEP 1[\s\S]*?(?=STEP 2|$)/i);
  const analysisMatch = thinking.match(/STEP 2[\s\S]*?(?=STEP 3|$)/i);
  const planMatch = thinking.match(/STEP 3[\s\S]*?(?=STEP 4|$)/i);
  const validationMatch = thinking.match(/STEP 4[\s\S]*?(?=STEP 5|$)/i);
  const synthesisMatch = thinking.match(/STEP 5[\s\S]*?$/i);
  
  if (understandMatch) sections.understanding = understandMatch[0].trim();
  if (analysisMatch) sections.analysis = analysisMatch[0].trim();
  if (planMatch) sections.plan = planMatch[0].trim();
  if (validationMatch) sections.validation = validationMatch[0].trim();
  if (synthesisMatch) sections.synthesis = synthesisMatch[0].trim();
  
  // Extract key points (bullet points or numbered lists)
  const keyPointMatches = thinking.match(/[-•*]\s+(.+?)(?=\n|$)/g);
  if (keyPointMatches) {
    sections.keyPoints = keyPointMatches
      .map(point => point.replace(/^[-•*]\s+/, '').trim())
      .filter(point => point.length > 0)
      .slice(0, 7); // Limit to 7 key points
  }
  
  // Extract concerns (safety, cultural, medical warnings)
  const concernPatterns = [
    /concern[s]?:(.+?)(?=\n\n|$)/gi,
    /warning[s]?:(.+?)(?=\n\n|$)/gi,
    /caution[s]?:(.+?)(?=\n\n|$)/gi,
    /safety:(.+?)(?=\n\n|$)/gi
  ];
  
  concernPatterns.forEach(pattern => {
    const matches = thinking.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        sections.concerns.push(match[1].trim());
      }
    }
  });
  
  // Extract action plan
  const actionMatch = thinking.match(/action[s]?:(.+?)(?=\n\n|$)/gi);
  if (actionMatch && actionMatch.length > 0) {
    sections.actionPlan = actionMatch[0].replace(/action[s]?:/i, '').trim();
  }
  
  return sections;
}

/**
 * Fast reasoning for simple queries (greeting, basic questions)
 * Skips full Chain-of-Thought for efficiency
 * 
 * @param {Object} params - { message, intent, userContext }
 * @returns {Object} - Simplified reasoning output
 */
export function fastReasoning({ message, intent, userContext }) {
  console.log('[ChainOfThought] 💨 Using fast reasoning for simple query');
  
  const reasoning = {
    understanding: `User is ${intent.intent}`,
    analysis: 'Sufficient context available',
    plan: 'Provide direct response',
    validation: 'No concerns for this query type',
    keyPoints: [],
    actionPlan: 'Respond naturally',
    concerns: [],
    reasoningTime: 0,
    isFastPath: true
  };
  
  // Generate quick key points based on intent
  switch (intent.intent) {
    case 'greeting':
      reasoning.keyPoints = ['Greet warmly', 'Reference user profile if available', 'Offer assistance'];
      break;
    case 'question_general':
      reasoning.keyPoints = ['Provide clear answer', 'Be educational', 'Offer to elaborate'];
      break;
    case 'motivation':
      reasoning.keyPoints = ['Acknowledge feelings', 'Provide encouragement', 'Remind of goals'];
      break;
    default:
      reasoning.keyPoints = ['Understand request', 'Provide helpful response', 'Be supportive'];
  }
  
  return reasoning;
}

/**
 * Determine if full Chain-of-Thought is needed
 * Some queries are simple enough for fast path
 * 
 * @param {Object} intent - Intent classification
 * @param {Object} dataNeeds - Data requirements
 * @returns {boolean} - True if full CoT needed
 */
export function needsFullReasoning(intent, dataNeeds) {
  // Always use full reasoning for high priority or complex intents
  if (dataNeeds.priority === 'high') return true;
  if (intent.requiresData) return true;
  
  // Simple greetings and basic questions can use fast path
  const simpleIntents = ['greeting', 'motivation', 'question_general'];
  if (simpleIntents.includes(intent.intent) && intent.confidence > 0.8) {
    return false;
  }
  
  return true;
}

/**
 * Main reasoning orchestrator
 * Decides between full Chain-of-Thought or fast reasoning
 * 
 * @param {Object} params - { message, intent, userContext, dataNeeds }
 * @returns {Promise<Object>} - Reasoning output
 */
export async function performReasoning(params) {
  const { intent, dataNeeds } = params;
  
  if (needsFullReasoning(intent, dataNeeds)) {
    return await executeChainOfThought(params);
  } else {
    return fastReasoning(params);
  }
}

/**
 * Format reasoning for debugging/logging
 * 
 * @param {Object} reasoning - Reasoning output
 * @returns {string} - Formatted reasoning summary
 */
export function formatReasoningSummary(reasoning) {
  let summary = '\n=== REASONING SUMMARY ===\n';
  
  if (reasoning.isFastPath) {
    summary += '⚡ Fast Reasoning Path\n';
  } else {
    summary += '🧠 Full Chain-of-Thought Reasoning\n';
  }
  
  summary += `\nKEY POINTS:\n`;
  reasoning.keyPoints.forEach((point, i) => {
    summary += `${i + 1}. ${point}\n`;
  });
  
  if (reasoning.concerns && reasoning.concerns.length > 0) {
    summary += `\n⚠️ CONCERNS:\n`;
    reasoning.concerns.forEach(concern => {
      summary += `- ${concern}\n`;
    });
  }
  
  if (reasoning.actionPlan) {
    summary += `\nACTION PLAN: ${reasoning.actionPlan}\n`;
  }
  
  summary += `\nReasoning Time: ${reasoning.reasoningTime}ms\n`;
  summary += '='.repeat(50) + '\n';
  
  return summary;
}
