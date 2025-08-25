// lib/enhancedAgent.js - Enhanced LangChain Agent Configuration
import { AgentExecutor, createToolCallingAgent, createStructuredChatAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createChatMemory } from "./memory";

/**
 * Enhanced agent configuration with better error handling and performance
 */
export class EnhancedAgent {
  constructor(llm, tools, userId) {
    this.llm = llm;
    this.tools = tools;
    this.userId = userId;
    this.metrics = {
      agentSuccessRate: 0,
      fallbackUsageRate: 0,
      averageResponseTime: 0,
      toolUsageFrequency: {},
      contextUtilization: 0,
      totalRequests: 0,
      successfulRequests: 0
    };
  }

  /**
   * Create enhanced agent with better configuration
   */
  async createAgent(systemPrompt) {
    try {
      // Create the prompt template for tool calling agent
      const finalPrompt = ChatPromptTemplate.fromMessages([
        ["system", systemPrompt],
        ["system", `Available tools:\n${this.tools.map(tool => `${tool.name}: ${tool.description || 'No description available'}`).join('\n')}\n\nTool names: ${this.tools.map(tool => tool.name).join(', ')}`],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
        ["system", "CRITICAL: You have access to powerful tools. When users ask about their workout plans, schedules, nutrition, or progress - ALWAYS use the appropriate tool to fetch real data first. Do not give generic responses. Use get_workout_plan for workout questions, nutrition_lookup for food questions, and calculate_health_metrics for health calculations."]
      ]);

      console.log("🔧 Creating agent with tools:", this.tools.map(t => t.name));
      
      // Create tool calling agent for better tool calling (more reliable than structured chat agent)
      const agent = await createToolCallingAgent({
        llm: this.llm,
        tools: this.tools,
        prompt: finalPrompt,
      });

      // Enhanced agent executor with better configuration
      const agentExecutor = new AgentExecutor({
        agent,
        tools: this.tools,
        verbose: process.env.NODE_ENV === 'development',
        maxIterations: 6, // Increased for more complex reasoning
        returnIntermediateSteps: true, // Enable to see tool usage
        handleParsingErrors: true,
        earlyStoppingMethod: "generate", // Better stopping criteria
        // Note: Memory is handled separately through chat history parameter
      });

      return agentExecutor;
    } catch (error) {
      console.error("Error creating enhanced agent:", error);
      throw new Error(`Failed to create enhanced agent: ${error.message}`);
    }
  }

  /**
   * Execute agent with enhanced error handling and metrics
   */
  async executeAgent(agentExecutor, input, chatHistory) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      console.log("🤖 Executing enhanced agent with comprehensive context...");
      console.log("🔧 Available tools:", this.tools.map(tool => tool.name));
      console.log("📝 Input:", input);
      
      const result = await agentExecutor.invoke({
        input: input,
        chat_history: chatHistory,
      });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime, result);
      
      console.log("✅ Enhanced agent execution completed successfully");
      console.log("📊 Result:", JSON.stringify(result, null, 2));
      console.log("🔧 Tools used:", result.intermediateSteps ? result.intermediateSteps.length : 0);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime, null, error);
      
      console.error("Error executing enhanced agent:", error);
      throw error;
    }
  }

  /**
   * Enhanced fallback mechanism with multiple strategies
   */
  async executeFallback(input, chatHistory, systemPrompt, userContext, vectorContext) {
    const startTime = Date.now();
    this.metrics.fallbackUsageRate++;

    try {
      console.log("Attempting enhanced fallback: direct LLM call with optimized context...");
      
      // Create a more focused system prompt for fallback
      const fallbackSystemPrompt = this.createOptimizedFallbackPrompt(
        systemPrompt, 
        userContext, 
        vectorContext
      );

      const fallbackResponse = await this.llm.invoke([
        new SystemMessage(fallbackSystemPrompt),
        ...chatHistory,
        new HumanMessage(input)
      ]);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime, { output: fallbackResponse.content });
      
      console.log("✅ Enhanced fallback successful with optimized context");
      return { output: fallbackResponse.content };
      
    } catch (fallbackError) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime, null, fallbackError);
      
      console.error("Enhanced fallback also failed:", fallbackError);
      throw fallbackError;
    }
  }

  /**
   * Create optimized fallback prompt
   */
  createOptimizedFallbackPrompt(systemPrompt, userContext, vectorContext) {
    // Compress context to avoid token limits
    const compressedContext = this.compressContext(userContext, 1500);
    const compressedVectorContext = this.compressContext(vectorContext, 800);

    return `${systemPrompt}

${compressedContext}

${compressedVectorContext}

IMPORTANT: Provide a helpful, personalized response based on the user's context. Use the available information to give specific, actionable advice. Focus on the most relevant aspects of their fitness journey.`;
  }

  /**
   * Compress context to fit within token limits
   */
  compressContext(context, maxLength) {
    if (!context || typeof context !== 'string') return '';
    
    if (context.length <= maxLength) return context;
    
    // Simple compression: take first and last parts
    const firstPart = context.substring(0, Math.floor(maxLength * 0.7));
    const lastPart = context.substring(context.length - Math.floor(maxLength * 0.3));
    
    return `${firstPart}...\n\n[Context truncated for length]...\n\n${lastPart}`;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(success, responseTime, result, error = null) {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / this.metrics.totalRequests;
    
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.agentSuccessRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    }

    // Track tool usage if available
    if (result && result.intermediateSteps) {
      result.intermediateSteps.forEach(step => {
        if (step.action && step.action.tool) {
          const toolName = step.action.tool;
          this.metrics.toolUsageFrequency[toolName] = 
            (this.metrics.toolUsageFrequency[toolName] || 0) + 1;
        }
      });
    }

    // Log error details in development
    if (error && process.env.NODE_ENV === 'development') {
      console.error("Agent execution error details:", {
        error: error.message,
        stack: error.stack,
        responseTime,
        metrics: this.metrics
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.agentSuccessRate,
      averageResponseTimeMs: Math.round(this.metrics.averageResponseTime),
      fallbackRate: this.metrics.fallbackUsageRate / this.metrics.totalRequests
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      agentSuccessRate: 0,
      fallbackUsageRate: 0,
      averageResponseTime: 0,
      toolUsageFrequency: {},
      contextUtilization: 0,
      totalRequests: 0,
      successfulRequests: 0
    };
  }
}

/**
 * Enhanced error handler with specific error categorization
 */
export class EnhancedErrorHandler {
  static categorizeError(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('tool') || errorMessage.includes('function')) {
      return 'TOOL_CALLING_ERROR';
    } else if (errorMessage.includes('context') || errorMessage.includes('token')) {
      return 'CONTEXT_OVERFLOW';
    } else if (errorMessage.includes('memory') || errorMessage.includes('database')) {
      return 'MEMORY_ERROR';
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return 'API_RATE_LIMIT';
    } else if (errorMessage.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    } else if (errorMessage.includes('api key')) {
      return 'AUTHENTICATION_ERROR';
    } else if (errorMessage.includes('safety')) {
      return 'SAFETY_FILTER_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  static handleError(error, context = {}) {
    const errorType = this.categorizeError(error);
    
    const errorHandlers = {
      'TOOL_CALLING_ERROR': () => ({
        error: "I'm having trouble processing your request with the available tools. Let me try a different approach.",
        status: 500,
        retry: true
      }),
      'CONTEXT_OVERFLOW': () => ({
        error: "The conversation context is too large. Let me summarize and continue.",
        status: 413,
        retry: true
      }),
      'MEMORY_ERROR': () => ({
        error: "There's an issue with the chat memory. Let me continue without previous context.",
        status: 500,
        retry: true
      }),
      'API_RATE_LIMIT': () => ({
        error: "I'm getting too many requests right now. Please wait a moment and try again.",
        status: 429,
        retry: false
      }),
      'TIMEOUT_ERROR': () => ({
        error: "The request is taking too long. Please try again.",
        status: 408,
        retry: true
      }),
      'AUTHENTICATION_ERROR': () => ({
        error: "There's an issue with the AI service configuration. Please check your API key.",
        status: 401,
        retry: false
      }),
      'SAFETY_FILTER_ERROR': () => ({
        error: "I can't provide a response to that message. Please try rephrasing your question.",
        status: 400,
        retry: false
      }),
      'UNKNOWN_ERROR': () => ({
        error: "I'm having trouble connecting right now. Let me try again!",
        status: 500,
        retry: true
      })
    };

    const handler = errorHandlers[errorType] || errorHandlers['UNKNOWN_ERROR'];
    return handler();
  }
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Context relevance scorer
 */
export function scoreContextRelevance(context, query) {
  if (!context || !query) return context;
  
  const queryKeywords = extractKeywords(query.toLowerCase());
  
  // Simple relevance scoring based on keyword matching
  const contextScores = {
    profile: calculateRelevance(context.profile || '', queryKeywords),
    diet: calculateRelevance(context.diet || '', queryKeywords),
    workout: calculateRelevance(context.workout || '', queryKeywords),
    progress: calculateRelevance(context.progress || '', queryKeywords)
  };
  
  // Sort by relevance score and return prioritized context
  const sortedContexts = Object.entries(contextScores)
    .sort(([,a], [,b]) => b - a)
    .map(([key]) => context[key])
    .filter(Boolean);
  
  return sortedContexts.join('\n\n');
}

/**
 * Extract keywords from query
 */
function extractKeywords(query) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  return query
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, '').toLowerCase())
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate relevance score between text and keywords
 */
function calculateRelevance(text, keywords) {
  if (!text || !keywords.length) return 0;
  
  const textLower = text.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    const matches = (textLower.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * keyword.length; // Weight by keyword length
  });
  
  return score;
}
