// src/ai/reasoning/reactLoop.js
// ReAct (Reasoning + Acting) Loop Implementation
// 
// Implements the ReAct principle: Think → Act → Observe → Reflect → Repeat
// The agent alternates between reasoning about what to do and taking actions (tool calls)
// until it has enough information to respond to the user.

import { createStreamingLLM } from "../config/llmconfig";
import { getToolByName } from "../tools";
import { REACT_LOOP_CONFIG, getRecommendedTools } from "../config/reactConfig";

/**
 * ReAct Loop Configuration (imported from config)
 * Can be customized in src/ai/config/reactConfig.js
 */
export { REACT_LOOP_CONFIG } from "../config/reactConfig";

/**
 * Execute ReAct Loop - Main Entry Point
 * 
 * The ReAct loop alternates between:
 * 1. REASON: Decide what action to take based on current knowledge
 * 2. ACT: Execute a tool to gather information or perform an action
 * 3. OBSERVE: Get the result from the tool
 * 4. REFLECT: Think about what was learned and what to do next
 * 5. REPEAT: Continue until sufficient information is gathered
 * 
 * @param {Object} params - { message, intent, userContext, userId }
 * @returns {Promise<Object>} - ReAct loop results with thoughts, actions, observations
 */
export async function executeReActLoop({ message, intent, userContext, userId }) {
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(80));
  console.log('[ReAct] 🔄 STARTING ReAct LOOP (Reasoning + Acting)');
  console.log('[ReAct] User Message:', message);
  console.log('[ReAct] Intent:', intent.intent);
  console.log('[ReAct] Max Steps:', REACT_LOOP_CONFIG.maxSteps);
  console.log('[ReAct] Max Tool Calls:', REACT_LOOP_CONFIG.maxToolCalls);
  
  // Show recommended tools for this intent
  const recommendedTools = getRecommendedTools(intent.intent);
  if (recommendedTools.length > 0) {
    console.log('[ReAct] Recommended Tools:', recommendedTools.join(', '));
  }
  
  console.log('='.repeat(80) + '\n');
  
  // ReAct loop state
  const thoughts = [];           // All reasoning steps
  const actions = [];            // All actions taken (tool calls)
  const observations = [];       // All tool results
  const reflexions = [];         // All reflections on tool results
  
  let currentStep = 0;
  let toolCallCount = 0;
  let isComplete = false;
  let finalSynthesis = '';
  let shouldRespond = false;
  
  try {
    // Create LLM for reasoning (non-streaming for structured output)
    const llm = createStreamingLLM(false);
    
    // Build accumulated knowledge across iterations
    let accumulatedKnowledge = buildInitialKnowledge(userContext);
    
    // ============================================================
    // MAIN ReAct LOOP
    // ============================================================
    while (currentStep < REACT_LOOP_CONFIG.maxSteps && !isComplete) {
      currentStep++;
      
      // Check timeout
      if (Date.now() - startTime > REACT_LOOP_CONFIG.timeoutMs) {
        console.log('[ReAct] ⏱️ Timeout reached. Wrapping up...');
        isComplete = true;
        finalSynthesis = 'Timeout reached. Proceeding with available information.';
        break;
      }
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`[ReAct] 🔄 STEP ${currentStep}/${REACT_LOOP_CONFIG.maxSteps}`);
      console.log(`${'─'.repeat(80)}`);
      
      // ============================================================
      // PHASE 1: REASON - What should I do next?
      // ============================================================
      console.log(`\n[ReAct] 🧠 Phase 1: REASONING...`);
      
      const reasoningPrompt = generateReasoningPrompt({
        message,
        intent,
        accumulatedKnowledge,
        previousThoughts: thoughts,
        previousActions: actions,
        previousObservations: observations,
        step: currentStep
      });
      
      const reasoningResponse = await llm.invoke([
        { role: 'system', content: 'You are an expert fitness coach using ReAct reasoning. Think step-by-step and decide what action to take.' },
        { role: 'user', content: reasoningPrompt }
      ]);
      
      const reasoningText = extractResponseText(reasoningResponse);
      thoughts.push({
        step: currentStep,
        thought: reasoningText,
        timestamp: Date.now()
      });
      
      console.log(`[ReAct] 💭 Thought:\n${reasoningText.substring(0, 200)}...`);
      
      // ============================================================
      // PHASE 2: DECIDE - Parse the decision from reasoning
      // ============================================================
      console.log(`\n[ReAct] 🎯 Phase 2: DECISION PARSING...`);
      
      const decision = parseReActDecision(reasoningText, intent);
      
      console.log(`[ReAct] Decision: ${decision.shouldRespond ? '✅ READY TO RESPOND' : '🔧 TAKE ACTION'}`);
      
      // Check if ready to respond
      if (decision.shouldRespond) {
        console.log(`[ReAct] ✅ Agent decided it has enough information`);
        isComplete = true;
        shouldRespond = true;
        finalSynthesis = reasoningText;
        break;
      }
      
      // Check if no action needed (edge case)
      if (!decision.shouldAct) {
        console.log(`[ReAct] ⚠️ No action needed. Wrapping up...`);
        isComplete = true;
        finalSynthesis = reasoningText;
        break;
      }
      
      // Check tool call limit
      if (toolCallCount >= REACT_LOOP_CONFIG.maxToolCalls) {
        console.log(`[ReAct] ⚠️ Tool call limit reached (${REACT_LOOP_CONFIG.maxToolCalls}). Proceeding with available data.`);
        isComplete = true;
        finalSynthesis = 'Tool call limit reached. Proceeding with available information.';
        break;
      }
      
      // ============================================================
      // PHASE 3: ACT - Execute the tool
      // ============================================================
      if (decision.shouldAct && decision.toolName) {
        console.log(`\n[ReAct] 🛠️ Phase 3: ACTING...`);
        console.log(`[ReAct] Tool: ${decision.toolName}`);
        console.log(`[ReAct] Params:`, JSON.stringify(decision.toolParams));
        
        const actionStartTime = Date.now();
        
        try {
          // Ensure userId is in params
          const toolParams = {
            ...decision.toolParams,
            userId: userId || decision.toolParams.userId
          };
          
          // Get and execute tool
          const toolFunction = getToolByName(decision.toolName);
          
          if (!toolFunction) {
            throw new Error(`Tool "${decision.toolName}" not found`);
          }
          
          // Execute tool
          const toolResult = await toolFunction(toolParams);
          const actionDuration = Date.now() - actionStartTime;
          
          console.log(`[ReAct] ✅ Tool executed in ${actionDuration}ms`);
          
          // Record action
          actions.push({
            step: currentStep,
            toolName: decision.toolName,
            params: toolParams,
            duration: actionDuration,
            timestamp: Date.now()
          });
          
          toolCallCount++;
          
          // ============================================================
          // PHASE 4: OBSERVE - Capture tool result
          // ============================================================
          console.log(`\n[ReAct] 👁️ Phase 4: OBSERVING...`);
          
          const observation = {
            step: currentStep,
            toolName: decision.toolName,
            result: toolResult,
            timestamp: Date.now()
          };
          
          observations.push(observation);
          
          // Log first 200 chars of result
          const resultPreview = typeof toolResult === 'string' 
            ? toolResult.substring(0, 200) 
            : JSON.stringify(toolResult).substring(0, 200);
          console.log(`[ReAct] 📊 Result:\n${resultPreview}...`);
          
          // ============================================================
          // PHASE 5: REFLECT - Think about what was learned
          // ============================================================
          if (REACT_LOOP_CONFIG.enableReflection) {
            console.log(`\n[ReAct] 🤔 Phase 5: REFLECTING...`);
            
            const reflexionPrompt = generateReflexionPrompt({
              previousThought: reasoningText,
              toolName: decision.toolName,
              toolResult,
              message,
              intent
            });
            
            const reflexionResponse = await llm.invoke([
              { role: 'system', content: 'Reflect on the tool result. What did you learn? What should you do next?' },
              { role: 'user', content: reflexionPrompt }
            ]);
            
            const reflexionText = extractResponseText(reflexionResponse);
            
            reflexions.push({
              step: currentStep,
              reflexion: reflexionText,
              timestamp: Date.now()
            });
            
            console.log(`[ReAct] 💡 Reflection:\n${reflexionText.substring(0, 200)}...`);
            
            // Update accumulated knowledge
            accumulatedKnowledge = updateKnowledge(
              accumulatedKnowledge,
              decision.toolName,
              toolResult,
              reflexionText
            );
          } else {
            // Update knowledge without reflection
            accumulatedKnowledge = updateKnowledge(
              accumulatedKnowledge,
              decision.toolName,
              toolResult,
              null
            );
          }
          
        } catch (toolError) {
          console.error(`[ReAct] ❌ Tool execution error:`, toolError.message);
          
          // Record failed observation
          observations.push({
            step: currentStep,
            toolName: decision.toolName,
            error: toolError.message,
            timestamp: Date.now()
          });
          
          // Continue loop - might recover with other tools
          accumulatedKnowledge += `\n[ERROR] ${decision.toolName} failed: ${toolError.message}`;
        }
      }
    }
    
    // ============================================================
    // FINALIZATION
    // ============================================================
    const totalTime = Date.now() - startTime;
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log('[ReAct] ✅ ReAct LOOP COMPLETE');
    console.log(`[ReAct] Steps taken: ${currentStep}`);
    console.log(`[ReAct] Tools called: ${toolCallCount}`);
    console.log(`[ReAct] Time elapsed: ${totalTime}ms`);
    console.log(`[ReAct] Ready to respond: ${shouldRespond ? 'YES' : 'YES (max steps reached)'}`);
    console.log(`${'═'.repeat(80)}\n`);
    
    // Extract key points for downstream use
    const keyPoints = extractKeyPoints(thoughts, observations);
    const concerns = extractConcerns(thoughts);
    const actionPlan = buildActionPlan(actions, observations);
    
    return {
      // ReAct-specific data
      reactEnabled: true,
      thoughts,
      actions,
      observations,
      reflexions,
      stepsUsed: currentStep,
      toolCallCount,
      
      // Backward compatible with Chain-of-Thought format
      rawThinking: combineThoughts(thoughts),
      keyPoints,
      actionPlan,
      concerns,
      reasoningTime: totalTime,
      timestamp: new Date().toISOString(),
      
      // Final analysis
      finalSynthesis,
      accumulatedKnowledge,
      isComplete: shouldRespond || isComplete
    };
    
  } catch (error) {
    console.error('[ReAct] ❌ Fatal error:', error);
    
    return {
      reactEnabled: true,
      thoughts: [{ step: 0, thought: 'Error during ReAct loop', timestamp: Date.now() }],
      actions: [],
      observations: [],
      reflexions: [],
      stepsUsed: currentStep,
      toolCallCount,
      rawThinking: `Error: ${error.message}`,
      keyPoints: [],
      actionPlan: 'Provide response based on available context',
      concerns: [error.message],
      reasoningTime: Date.now() - startTime,
      isComplete: false
    };
  }
}

/**
 * Generate reasoning prompt for ReAct loop
 * Provides context and asks agent to decide next action
 */
function generateReasoningPrompt({ message, intent, accumulatedKnowledge, previousThoughts, previousActions, previousObservations, step }) {
  let prompt = `You are Coachlix AI, an expert fitness coach using the ReAct framework (Reasoning + Acting).

USER MESSAGE: "${message}"
DETECTED INTENT: ${intent.intent}

ACCUMULATED KNOWLEDGE SO FAR:
${accumulatedKnowledge}
`;

  // Add history if exists
  if (previousThoughts.length > 0) {
    prompt += `\n\nPREVIOUS REASONING STEPS:\n`;
    previousThoughts.slice(-3).forEach((t, i) => {
      prompt += `Step ${t.step}: ${t.thought.substring(0, 150)}...\n`;
    });
  }
  
  if (previousActions.length > 0) {
    prompt += `\n\nPREVIOUS ACTIONS TAKEN:\n`;
    previousActions.forEach((a) => {
      prompt += `- ${a.toolName} with params ${JSON.stringify(a.params)}\n`;
    });
  }
  
  if (previousObservations.length > 0) {
    prompt += `\n\nPREVIOUS OBSERVATIONS:\n`;
    previousObservations.slice(-3).forEach((obs) => {
      const resultPreview = typeof obs.result === 'string' 
        ? obs.result.substring(0, 100)
        : JSON.stringify(obs.result).substring(0, 100);
      prompt += `- ${obs.toolName} result: ${resultPreview}...\n`;
    });
  }

  prompt += `\n\nAVAILABLE TOOLS:
1. fetch_details - Get detailed diet or workout information
   Params: { type: "diet"|"workout", detail: "today"|"full"|"specific_day", dayNumber?: number }

2. nutrition_lookup - Look up nutrition information for specific foods
   Params: { foodName: string }

3. calculate_health_metrics - Calculate BMI, BMR, TDEE, calorie needs
   Params: { action: "calculate"|"get" }

4. create_diet_plan - Create a new personalized diet plan
   Params: { planName: string, goal?: string, targetCalories?: number, duration?: number }

5. update_workout_plan - Create or update workout plans
   Params: { planName?: string, action?: "get"|"create"|"update", goal?: string }

YOUR TASK (Step ${step}):
1. Think carefully: Do you have enough information to answer the user's question?
2. If YES, respond with: DECISION: RESPOND
3. If NO, decide which tool to call next and why.

RESPONSE FORMAT:
THOUGHT: [Your reasoning about what to do next]
DECISION: [Either "RESPOND" if ready, or "CALL_TOOL: tool_name"]
TOOL_PARAMS: [If calling tool, provide JSON params, otherwise "N/A"]
REASON: [Brief explanation of your decision]

Think step-by-step. Be concise.`;

  return prompt;
}

/**
 * Generate reflexion prompt after tool execution
 * Helps agent learn from tool results
 */
function generateReflexionPrompt({ previousThought, toolName, toolResult, message, intent }) {
  const resultPreview = typeof toolResult === 'string' 
    ? toolResult.substring(0, 500)
    : JSON.stringify(toolResult).substring(0, 500);
    
  return `You just called ${toolName} and got this result:

TOOL RESULT:
${resultPreview}

USER'S ORIGINAL REQUEST: "${message}"
INTENT: ${intent.intent}

YOUR PREVIOUS THOUGHT:
${previousThought.substring(0, 300)}

REFLECT:
1. What valuable information did you learn?
2. Is this information relevant to the user's request?
3. Do you need more information, or can you now respond?

Keep your reflection brief and actionable.`;
}

/**
 * Parse ReAct decision from LLM reasoning output
 */
function parseReActDecision(responseText, intent) {
  const decision = {
    shouldAct: false,
    shouldRespond: false,
    action: '',
    toolName: '',
    toolParams: {}
  };
  
  // Check if should respond (ready with answer)
  if (responseText.match(/DECISION:\s*RESPOND/i) || 
      responseText.match(/ready\s+to\s+respond|enough\s+information|sufficient\s+data/i)) {
    decision.shouldRespond = true;
    decision.shouldAct = false;
    return decision;
  }
  
  // Extract tool name from DECISION line
  const toolMatch = responseText.match(/DECISION:\s*CALL_TOOL:\s*(\w+)/i) ||
                    responseText.match(/call\s+(\w+)\s+tool/i) ||
                    responseText.match(/use\s+(\w+)\s+to/i);
  
  if (toolMatch) {
    let toolName = toolMatch[1];
    
    // Map common variations to actual tool names
    const toolMapping = {
      'fetch': 'fetch_details',
      'details': 'fetch_details',
      'nutrition': 'nutrition_lookup',
      'health': 'calculate_health_metrics',
      'metrics': 'calculate_health_metrics',
      'diet': 'create_diet_plan',
      'workout': 'update_workout_plan'
    };
    
    decision.toolName = toolMapping[toolName.toLowerCase()] || toolName;
    decision.shouldAct = true;
    decision.action = `Call ${decision.toolName}`;
  }
  
  // Extract parameters (try to parse JSON)
  const paramsMatch = responseText.match(/TOOL_PARAMS:\s*({[\s\S]*?})/i);
  if (paramsMatch) {
    try {
      decision.toolParams = JSON.parse(paramsMatch[1]);
    } catch (e) {
      // Try to extract params from text
      decision.toolParams = extractParamsFromText(responseText, decision.toolName);
    }
  } else {
    // Try to extract params from text
    decision.toolParams = extractParamsFromText(responseText, decision.toolName);
  }
  
  return decision;
}

/**
 * Extract parameters from natural language text
 */
function extractParamsFromText(text, toolName) {
  const params = {};
  
  // Common patterns for fetch_details
  if (toolName === 'fetch_details') {
    if (text.match(/diet|meal|food/i)) params.type = 'diet';
    if (text.match(/workout|exercise/i)) params.type = 'workout';
    if (text.match(/today/i)) params.detail = 'today';
    if (text.match(/full|complete|all/i)) params.detail = 'full';
  }
  
  // Common patterns for nutrition_lookup
  if (toolName === 'nutrition_lookup') {
    const foodMatch = text.match(/food(?:Name)?[:\s]+["\']?(\w+)/i);
    if (foodMatch) params.foodName = foodMatch[1];
  }
  
  // Common patterns for health metrics
  if (toolName === 'calculate_health_metrics') {
    if (text.match(/calculate/i)) params.action = 'calculate';
    if (text.match(/get|retrieve/i)) params.action = 'get';
  }
  
  return params;
}

/**
 * Extract response text from different LLM response formats
 */
function extractResponseText(response) {
  if (typeof response === 'string') return response;
  if (response.content) return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  if (response.text) return response.text;
  return JSON.stringify(response);
}

/**
 * Build initial knowledge from user context
 */
function buildInitialKnowledge(userContext) {
  let knowledge = 'USER CONTEXT:\n';
  
  if (userContext.profile) {
    knowledge += `- Name: ${userContext.profile.name || 'Unknown'}\n`;
    knowledge += `- Fitness Goal: ${userContext.profile.fitnessGoal || 'Not specified'}\n`;
    knowledge += `- Diet Preference: ${userContext.profile.dietaryPreferences || 'Not specified'}\n`;
  }
  
  if (userContext.dietPlan) {
    knowledge += '- Has Active Diet Plan: YES\n';
  } else {
    knowledge += '- Has Active Diet Plan: NO\n';
  }
  
  if (userContext.workoutPlan) {
    knowledge += '- Has Active Workout Plan: YES\n';
  } else {
    knowledge += '- Has Active Workout Plan: NO\n';
  }
  
  return knowledge;
}

/**
 * Update accumulated knowledge with new tool results
 */
function updateKnowledge(currentKnowledge, toolName, toolResult, reflexion) {
  let newKnowledge = currentKnowledge + '\n\n';
  newKnowledge += `[NEW DATA from ${toolName}]:\n`;
  
  const resultText = typeof toolResult === 'string' 
    ? toolResult.substring(0, 300)
    : JSON.stringify(toolResult).substring(0, 300);
  
  newKnowledge += resultText + '...\n';
  
  if (reflexion) {
    newKnowledge += `[INSIGHT]: ${reflexion.substring(0, 200)}...\n`;
  }
  
  return newKnowledge;
}

/**
 * Extract key points from thoughts and observations
 */
function extractKeyPoints(thoughts, observations) {
  const points = [];
  
  // From thoughts
  thoughts.forEach(t => {
    const matches = t.thought.match(/[-•*]\s+(.+?)(?=\n|$)/g);
    if (matches) {
      matches.forEach(match => {
        const point = match.replace(/^[-•*]\s+/, '').trim();
        if (point && !points.includes(point)) {
          points.push(point);
        }
      });
    }
  });
  
  // From observations
  observations.forEach(obs => {
    if (obs.toolName) {
      points.push(`Retrieved data from ${obs.toolName}`);
    }
  });
  
  return points.slice(0, 7);
}

/**
 * Extract concerns from thoughts
 */
function extractConcerns(thoughts) {
  const concerns = [];
  
  thoughts.forEach(t => {
    const matches = t.thought.match(/(concern|warning|caution|risk)[\s:]+(.+?)(?=\n|$)/gi);
    if (matches) {
      matches.forEach(match => {
        const concern = match.replace(/(concern|warning|caution|risk)[\s:]+/i, '').trim();
        if (concern && !concerns.includes(concern)) {
          concerns.push(concern);
        }
      });
    }
  });
  
  return concerns;
}

/**
 * Build action plan from actions and observations
 */
function buildActionPlan(actions, observations) {
  if (actions.length === 0) return 'Respond based on available context';
  return `Gathered data through ${actions.length} tool calls: ${actions.map(a => a.toolName).join(', ')}`;
}

/**
 * Combine all thoughts into single text
 */
function combineThoughts(thoughts) {
  return thoughts.map((t, i) => `Step ${t.step}:\n${t.thought}`).join('\n\n---\n\n');
}
