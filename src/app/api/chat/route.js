// app/api/chat/route.js - Enhanced with User Context Retrieval, Vector Search, Streaming Support, and LangSmith Tracing
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import {
  createChatMemory,
  getRecentChatHistory,
  addToHistory,
  formatChatHistoryForContext,
} from "@/lib/memory";
import {
  enhancedVectorSearch,
  hybridSearch,
  createPersonalizedKnowledgeBase,
} from "@/lib/enhancedVectorSearch.js";
import { getFitnessTools } from "@/lib/tools";
import { classifyIntent, mapCategoryToPlan } from "@/lib/routerAgent";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

// Import the enhanced context retrieval system
import { getEnhancedUserContext } from "@/lib/contextRetrieval";

// Import the enhanced agent
import {
  EnhancedAgent,
  EnhancedErrorHandler,
  retryWithBackoff,
} from "@/lib/enhancedAgent";
import {
  buildFullSystemPrompt,
  buildStreamingSystemPrompt,
} from "@/lib/prompts";

// Import LangSmith for tracing
import { Client as LangSmithClient } from "langsmith";

// Initialize LangSmith client if tracing is enabled
let langsmithClient = null;
if (process.env.LANGCHAIN_TRACING_V2 === "true" && process.env.LANGCHAIN_API_KEY) {
  try {
    langsmithClient = new LangSmithClient({
      apiKey: process.env.LANGCHAIN_API_KEY,
    });
    console.log("✅ LangSmith tracing enabled");
  } catch (error) {
    console.warn("⚠️ Failed to initialize LangSmith:", error.message);
  }
}

export async function POST(request) {
  try {
    const {
      message,
      plan,
      conversationHistory,
      profile,
      userId,
      streaming = false,
    } = await request.json();

    // Validate required fields
    if (!message || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Message and userId are required",
        },
        { status: 400 }
      );
    }

    // If streaming is requested, set up SSE response
    if (streaming) {
      return handleStreamingResponse(request, {
        message,
        plan,
        conversationHistory,
        profile,
        userId,
      });
    }

    // Debug environment variables
    console.log("Environment check:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json(
        {
          success: false,
          error:
            "AI service configuration error. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    if (process.env.GEMINI_API_KEY.length < 10) {
      console.error("GEMINI_API_KEY appears to be invalid (too short)");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key format.",
        },
        { status: 500 }
      );
    }

    // **IMPROVED: Initialize LangChain components with better error handling**
    let llm;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
        throw new Error("GEMINI_API_KEY is not properly configured");
      }

      console.log("Attempting ChatGoogleGenerativeAI initialization...");

      // **ENHANCED: Use more robust model configuration with LangSmith tracing**
      const llmConfig = {
        apiKey: process.env.GEMINI_API_KEY.trim(),
        model: "gemini-2.5-flash", // Updated to current model
        temperature: 0.7,
        maxOutputTokens: 1500, // Reduced for better free tier efficiency
        topP: 0.9,
        topK: 40,
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      // Add LangSmith callbacks if tracing is enabled
      if (process.env.LANGCHAIN_TRACING_V2 === "true") {
        llmConfig.callbacks = [];
        llmConfig.metadata = {
          userId: userId,
          plan: plan || "general",
          streaming: streaming,
        };
        llmConfig.tags = ["chat-api", "gemini-2.5-flash", userId];
      }

      const llm = new ChatGoogleGenerativeAI(llmConfig);

      console.log("✓ ChatGoogleGenerativeAI initialized successfully");
    } catch (error) {
      console.error("Error initializing ChatGoogleGenerativeAI:", error);

      // Check for specific error types
      let errorMessage = "Failed to initialize AI model.";
      let statusCode = 500;

      if (error.message && error.message.includes("quota")) {
        errorMessage =
          "Google AI API quota exceeded. Please check your billing or try again later.";
        statusCode = 429;
      } else if (error.message && error.message.includes("not found")) {
        errorMessage =
          "AI model not available. Please check the model configuration.";
        statusCode = 404;
      } else if (error.message && error.message.includes("API key")) {
        errorMessage =
          "Invalid API key. Please check your Google AI API key configuration.";
        statusCode = 401;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
          suggestion: "Check your Google AI API key and billing status",
        },
        { status: statusCode }
      );
    }

    //* Quick intent classification to optionally adjust plan
    let routedPlan = plan;
    try {
      const intent = await classifyIntent(llm, message);
      if (intent?.category) {
        const mapped = mapCategoryToPlan(intent.category);
        routedPlan = mapped || plan;
      }
    } catch (e) {
      // if router fails, continue with provided plan
    }

    // Get available tools
    let tools;
    try {
      tools = getFitnessTools();
      console.log(`✓ Loaded ${tools.length} fitness tools`);
    } catch (error) {
      console.error("Error getting fitness tools:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to load fitness tools.",
        },
        { status: 500 }
      );
    }

    // **ENHANCED: Retrieve comprehensive user context with better error handling**
    console.log("🔍 Retrieving enhanced user context...");
    let userContext;
    try {
      userContext = await getEnhancedUserContext(userId, message, 2500); // Increased context length
      console.log("✅ Enhanced user context retrieved successfully");
      console.log(
        `📊 Context sections: ${
          userContext.contextSections || "N/A"
        }, Length: ${userContext.totalLength || "N/A"}`
      );
    } catch (error) {
      console.error("❌ Error retrieving enhanced user context:", error);
      userContext = {
        profile: "Error loading comprehensive profile",
        diet: "Error loading detailed diet plans",
        workout: "Error loading detailed workout plans",
        progress: "Error loading progress tracking",
        combined: "Could not load comprehensive personalized context",
      };
    }

    // **ENHANCED: Perform personalized vector search with better error handling**
    console.log("🔍 Performing personalized vector search...");
    let vectorSearchResults = [];
    try {
      // Use hybrid search for better results
      vectorSearchResults = await hybridSearch(message, userId, 5); // Increased results
      console.log(
        `✅ Vector search completed: ${vectorSearchResults.length} results found`
      );

      // Create personalized knowledge base if this is a new user interaction
      if (vectorSearchResults.length === 0) {
        console.log("🧠 Creating personalized knowledge base...");
        await createPersonalizedKnowledgeBase(userId);
        // Retry search after creating personalized content
        vectorSearchResults = await enhancedVectorSearch(
          message,
          userId,
          {},
          4
        );
      }
    } catch (error) {
      console.error("❌ Error in personalized vector search:", error);

      // Check if it's a quota error
      if (error.message && error.message.includes("quota")) {
        console.log(
          "🔄 Vector search quota exceeded, skipping vector search for this request"
        );
      } else if (error.message && error.message.includes("429")) {
        console.log("🔄 Rate limit hit, continuing without vector search");
      }

      // Continue without vector search if there's an error
      vectorSearchResults = [];
    }

    // Build system prompt via centralized prompts module

    // **ENHANCED: Get persistent chat history from MongoDB with better error handling**
    let chatHistoryContext = "";
    try {
      const recentHistory = await getRecentChatHistory(userId, 6); // Increased to 6 exchanges
      chatHistoryContext = formatChatHistoryForContext(recentHistory, 1000); // Increased context length
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Continue without history if there's an error
    }

    // **ENHANCED: Format vector search results for context**
    let vectorContext = "";
    try {
      vectorContext = formatVectorResultsForContext(vectorSearchResults, 1000); // Increased context length
    } catch (error) {
      console.error("Error formatting vector search results:", error);
    }

    const fullSystemPrompt = buildFullSystemPrompt({
      plan: routedPlan,
      profile,
      userContextCombined: userContext.combined,
      chatHistoryContext,
      vectorContext,
    });

    // **ENHANCED: Create enhanced agent with better configuration**
    const enhancedAgent = new EnhancedAgent(llm, tools, userId);

    // Create the enhanced agent
    let agentExecutor;
    try {
      agentExecutor = await enhancedAgent.createAgent(fullSystemPrompt);
      console.log("✓ Enhanced agent created successfully");
    } catch (error) {
      console.error("Error creating enhanced agent:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to initialize enhanced AI agent.",
        },
        { status: 500 }
      );
    }

    // **ENHANCED: Prepare messages for the agent with better validation**
    const chatHistory = [];

    // Add recent conversation history if available
    if (
      conversationHistory &&
      Array.isArray(conversationHistory) &&
      conversationHistory.length > 0
    ) {
      // Take last 8 messages to avoid token limits but provide more context
      const recentMessages = conversationHistory.slice(-8);
      for (const msg of recentMessages) {
        try {
          if (
            msg.role === "user" &&
            msg.content &&
            typeof msg.content === "string"
          ) {
            chatHistory.push(new HumanMessage(msg.content));
          } else if (
            msg.role === "ai" &&
            msg.content &&
            typeof msg.content === "string"
          ) {
            chatHistory.push(new AIMessage(msg.content));
          }
        } catch (error) {
          console.error("Error processing chat history message:", error);
          // Skip this message and continue
        }
      }
    }

    // **ENHANCED: Execute the agent with better error handling and fallback**
    let result;
    try {
      result = await retryWithBackoff(
        () => enhancedAgent.executeAgent(agentExecutor, message, chatHistory),
        3 // max retries
      );
      console.log("✅ Enhanced agent execution completed successfully");
    } catch (error) {
      console.error("Error executing enhanced agent:", error);

      // Use enhanced error handling
      const errorInfo = EnhancedErrorHandler.handleError(error);

      if (errorInfo.retry) {
        // Try enhanced fallback
        try {
          result = await enhancedAgent.executeFallback(
            message,
            chatHistory,
            systemPrompt,
            userContext.combined,
            vectorContext
          );
          console.log("✅ Enhanced fallback successful");
        } catch (fallbackError) {
          console.error("Enhanced fallback also failed:", fallbackError);
          return NextResponse.json(
            {
              success: false,
              error: errorInfo.error,
            },
            { status: errorInfo.status }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: errorInfo.error,
          },
          { status: errorInfo.status }
        );
      }
    }

    // **ENHANCED: Extract the final response with better validation**
    const aiResponse =
      result?.output ||
      "I apologize, but I'm having trouble responding right now. Please try again.";

    // Validate response quality
    if (aiResponse.length < 10) {
      console.warn("AI response seems too short, may indicate an issue");
    }

    // **ENHANCED: Save conversation to persistent memory with better error handling**
    try {
      await addToHistory(userId, [
        { role: "user", content: message },
        { role: "ai", content: aiResponse },
      ]);
      console.log("✅ Chat history saved successfully");
    } catch (error) {
      console.error("Error saving to chat history:", error);
      // Continue even if saving fails - don't break the response
    }

    // **ENHANCED: Generate contextual suggestions based on comprehensive user data**
    const suggestions = generateComprehensiveSuggestions(
      aiResponse,
      plan,
      message,
      profile,
      userContext,
      vectorSearchResults
    );

    // **ENHANCED: Return enhanced response data with better debugging**
    const responseData = {
      success: true,
      response: aiResponse,
      suggestions: suggestions,
      metrics: enhancedAgent.getMetrics(), // Add enhanced agent metrics
    };

    // Add comprehensive context info for development debugging
    if (process.env.NODE_ENV === "development") {
      responseData.debug = {
        contextUsed: {
          profileLoaded:
            userContext.profile &&
            !userContext.profile.includes("Error loading"),
          dietPlansFound:
            userContext.diet &&
            !userContext.diet.includes("No active diet plans"),
          workoutPlansFound:
            userContext.workout &&
            !userContext.workout.includes("No active workout plans"),
          progressTracking:
            userContext.progress &&
            !userContext.progress.includes("Error loading"),
          vectorResultsCount: vectorSearchResults.length,
          contextTotalLength: userContext.totalLength || 0,
          contextSections: userContext.contextSections || 0,
        },
        vectorSearch: {
          resultsFound: vectorSearchResults.length,
          topResultTitles: vectorSearchResults
            .slice(0, 3)
            .map((r) => r.metadata?.title || "Unknown"),
          searchQuality: vectorSearchResults.filter(
            (r) => r.finalRelevanceScore > 0.7
          ).length,
        },
        agentExecution: {
          usedAgent: result?.output ? true : false,
          fallbackUsed: !result?.output ? true : false,
          responseLength: aiResponse.length,
        },
        enhancedAgentMetrics: enhancedAgent.getMetrics(),
        contextUtilization: enhancedAgent.metrics.contextUtilization,
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Chat API Error:", error);

    // **ENHANCED: Handle specific LangChain/Gemini errors with better categorization**
    let errorMessage =
      "I'm having trouble connecting right now. Let me try again!";
    let statusCode = 500;

    if (
      error.message?.includes("API key") ||
      error.message?.includes("GEMINI_API_KEY")
    ) {
      errorMessage =
        "There's an issue with the AI service configuration. Please check your API key.";
      statusCode = 401;
    } else if (
      error.message?.includes("rate limit") ||
      error.message?.includes("quota")
    ) {
      errorMessage =
        "I'm getting too many requests right now. Please wait a moment and try again.";
      statusCode = 429;
    } else if (
      error.message?.includes("safety") ||
      error.message?.includes("blocked")
    ) {
      errorMessage =
        "I can't provide a response to that message. Please try rephrasing your question.";
      statusCode = 400;
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("timeout")
    ) {
      errorMessage = "Network connection issue. Please try again.";
      statusCode = 503;
    } else if (
      error.message?.includes("memory") ||
      error.message?.includes("database")
    ) {
      errorMessage = "There's an issue with the chat memory. Please try again.";
      statusCode = 500;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: statusCode }
    );
  }
}

/**
 * Handle streaming response using Server-Sent Events
 */
async function handleStreamingResponse(
  request,
  { message, plan, conversationHistory, profile, userId }
) {
  try {
    // Set up SSE headers
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "connection",
                message: "Connected to streaming chat",
              })}\n\n`
            )
          );

          // Initialize LLM and tools (same as non-streaming)
          const llm = new ChatGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY.trim(),
            model: "gemini-2.5-flash", // Updated to current model
            temperature: 0.7,
            maxOutputTokens: 1500, // Reduced for better free tier efficiency
            topP: 0.9,
            topK: 40,
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          });

          const tools = getFitnessTools();

          // Get user context and vector search results
          const userContext = await getEnhancedUserContext(
            userId,
            message,
            2500
          );
          const vectorSearchResults = await hybridSearch(message, userId, 5);

          // Build system prompt using centralized prompts module
          const fullSystemPrompt = buildStreamingSystemPrompt({
            plan: plan,
            profile,
            userContextCombined: userContext.combined,
          });

          // Create enhanced agent
          const enhancedAgent = new EnhancedAgent(llm, tools, userId);
          const agentExecutor = await enhancedAgent.createAgent(
            fullSystemPrompt
          );

          // Prepare chat history
          const chatHistory = [];
          if (
            conversationHistory &&
            Array.isArray(conversationHistory) &&
            conversationHistory.length > 0
          ) {
            const recentMessages = conversationHistory.slice(-8);
            for (const msg of recentMessages) {
              try {
                if (
                  msg.role === "user" &&
                  msg.content &&
                  typeof msg.content === "string"
                ) {
                  chatHistory.push(new HumanMessage(msg.content));
                } else if (
                  msg.role === "ai" &&
                  msg.content &&
                  typeof msg.content === "string"
                ) {
                  chatHistory.push(new AIMessage(msg.content));
                }
              } catch (error) {
                console.error("Error processing chat history message:", error);
              }
            }
          }

          // Execute agent with streaming
          try {
            const result = await retryWithBackoff(
              () =>
                enhancedAgent.executeAgent(agentExecutor, message, chatHistory),
              3
            );

            const aiResponse =
              result?.output ||
              "I apologize, but I'm having trouble responding right now. Please try again.";

            // Stream the response word by word
            const words = aiResponse.split(/(\s+)/);
            let currentResponse = "";

            for (let i = 0; i < words.length; i++) {
              const word = words[i];
              currentResponse += word;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "word",
                    word: word,
                    partialResponse: currentResponse,
                    isComplete: i === words.length - 1,
                  })}\n\n`
                )
              );

              await new Promise((resolve) =>
                setTimeout(resolve, 50 + Math.random() * 100)
              );
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  fullResponse: aiResponse,
                  suggestions: generateComprehensiveSuggestions(
                    aiResponse,
                    plan,
                    message,
                    profile,
                    userContext,
                    vectorSearchResults
                  ),
                })}\n\n`
              )
            );

            try {
              await addToHistory(userId, [
                { role: "user", content: message },
                { role: "ai", content: aiResponse },
              ]);
            } catch (error) {
              console.error("Error saving to chat history:", error);
            }
          } catch (error) {
            console.error("Error executing enhanced agent:", error);

            // Try direct LLM fallback and stream it
            try {
              const fallbackSystemPrompt = buildStreamingSystemPrompt({
                plan,
                profile,
                userContextCombined: userContext.combined,
              });
              const fallbackResponse = await llm.invoke([
                new SystemMessage(fallbackSystemPrompt),
                ...chatHistory,
                new HumanMessage(message),
              ]);
              const content =
                typeof fallbackResponse?.content === "string"
                  ? fallbackResponse.content
                  : Array.isArray(fallbackResponse?.content)
                  ? fallbackResponse.content
                      .map((c) => (typeof c === "string" ? c : c?.text || ""))
                      .join("")
                  : "";
              const aiResponse =
                content ||
                "I apologize, but I'm having trouble responding right now. Please try again.";

              const words = aiResponse.split(/(\s+)/);
              let currentResponse = "";
              for (let i = 0; i < words.length; i++) {
                const word = words[i];
                currentResponse += word;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "word",
                      word: word,
                      partialResponse: currentResponse,
                      isComplete: i === words.length - 1,
                    })}\n\n`
                  )
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 50 + Math.random() * 100)
                );
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "complete",
                    fullResponse: aiResponse,
                    suggestions: generateComprehensiveSuggestions(
                      aiResponse,
                      plan,
                      message,
                      profile,
                      userContext,
                      vectorSearchResults
                    ),
                  })}\n\n`
                )
              );

              try {
                await addToHistory(userId, [
                  { role: "user", content: message },
                  { role: "ai", content: aiResponse },
                ]);
              } catch (err2) {
                console.error("Error saving fallback chat history:", err2);
              }
            } catch (fallbackErr) {
              console.error("Streaming fallback also failed:", fallbackErr);
              const errorInfo = EnhancedErrorHandler.handleError(error);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    error: errorInfo.error,
                  })}\n\n`
                )
              );
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "An unexpected error occurred during streaming.",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error setting up streaming:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up streaming response",
      },
      { status: 500 }
    );
  }
}

/**
 * Format vector search results for LLM context
 */
function formatVectorResultsForContext(results, maxLength = 800) {
  if (!results || results.length === 0) {
    return "";
  }

  let context = `\n🧠 === RELEVANT KNOWLEDGE BASE ===\n`;
  let remainingLength = maxLength - context.length;

  for (const result of results) {
    if (remainingLength <= 100) break; // Save space for closing

    let resultText = "";
    if (result.formattedContent) {
      resultText = result.formattedContent;
    } else {
      resultText = `\n📚 ${result.metadata?.title || "Knowledge"}\n${
        result.content
      }`;
      if (result.finalRelevanceScore && result.finalRelevanceScore > 0.7) {
        resultText += ` ⭐ (Highly Relevant)`;
      }
    }

    if (resultText.length <= remainingLength) {
      context += resultText + "\n";
      remainingLength -= resultText.length + 1;
    } else {
      // Truncate but keep essential info
      const truncated = resultText.substring(0, remainingLength - 50) + "...\n";
      context += truncated;
      break;
    }
  }

  context += `=== END KNOWLEDGE BASE ===\n`;
  return context;
}

/**
 * Enhanced suggestion generation with comprehensive user context awareness
 */
function generateComprehensiveSuggestions(
  response,
  plan,
  userMessage,
  profile,
  userContext,
  vectorResults
) {
  const suggestions = [];

  // Validate inputs
  if (!response || typeof response !== "string") {
    return getDefaultSuggestions(plan);
  }

  // Analyze the response content and comprehensive user context
  const responseLower = response.toLowerCase();
  const messageLower = (userMessage || "").toLowerCase();

  // Check user's actual context
  const hasActiveDiet =
    userContext?.diet &&
    !userContext.diet.includes("No active diet plans") &&
    !userContext.diet.includes("Error loading");
  const hasActiveWorkout =
    userContext?.workout &&
    !userContext.workout.includes("No active workout plans") &&
    !userContext.workout.includes("Error loading");
  const hasProgressData =
    userContext?.progress &&
    !userContext.progress.includes("Error loading progress");
  const hasVectorResults = vectorResults && vectorResults.length > 0;

  // Context-aware suggestions based on user's actual comprehensive data
  if (
    hasActiveDiet &&
    (responseLower.includes("meal") ||
      responseLower.includes("diet") ||
      responseLower.includes("nutrition"))
  ) {
    suggestions.push("Show me today's detailed meal plan");
    if (
      userContext.diet.includes("calories") ||
      userContext.diet.includes("protein")
    ) {
      suggestions.push("Track my current nutrition progress");
    }
  }

  if (
    hasActiveWorkout &&
    (responseLower.includes("workout") ||
      responseLower.includes("exercise") ||
      responseLower.includes("training"))
  ) {
    suggestions.push("Show my current workout schedule");
    if (
      userContext.workout.includes("Week") ||
      userContext.workout.includes("week")
    ) {
      suggestions.push("Update my workout intensity");
    }
  }

  if (
    hasProgressData &&
    (responseLower.includes("progress") || responseLower.includes("track"))
  ) {
    suggestions.push("View my detailed progress report");
    if (
      userContext.progress.includes("weight") ||
      userContext.progress.includes("Weight")
    ) {
      suggestions.push("Log my latest measurements");
    }
  }

  // Vector search result-based suggestions
  if (hasVectorResults && suggestions.length < 3) {
    const topResult = vectorResults[0];
    if (
      topResult?.metadata?.type === "workout" &&
      !suggestions.some((s) => s.includes("workout"))
    ) {
      suggestions.push("Create a workout based on this knowledge");
    } else if (
      topResult?.metadata?.type === "nutrition" &&
      !suggestions.some((s) => s.includes("nutrition"))
    ) {
      suggestions.push("Get personalized nutrition advice");
    }
  }

  // Profile-aware intelligent suggestions
  if (profile?.fitnessGoal && suggestions.length < 3) {
    if (profile.fitnessGoal.includes("Weight Loss")) {
      if (!suggestions.some((s) => s.includes("calorie"))) {
        suggestions.push("Calculate my weight loss calories");
      }
      if (hasActiveDiet && !suggestions.some((s) => s.includes("deficit"))) {
        suggestions.push("Check my calorie deficit progress");
      }
    } else if (profile.fitnessGoal.includes("Muscle Gain")) {
      if (!suggestions.some((s) => s.includes("protein"))) {
        suggestions.push("Check my daily protein targets");
      }
      if (
        hasActiveWorkout &&
        !suggestions.some((s) => s.includes("strength"))
      ) {
        suggestions.push("Track my strength improvements");
      }
    } else if (profile.fitnessGoal.includes("badminton")) {
      if (!suggestions.some((s) => s.includes("badminton"))) {
        suggestions.push("Show badminton-specific training");
      }
    }
  }

  // Plan-specific enhanced suggestions
  if (plan === "badminton" && suggestions.length < 4) {
    if (responseLower.includes("drill") || responseLower.includes("practice")) {
      suggestions.push("Create personalized drill routine");
    }
    if (responseLower.includes("technique") || responseLower.includes("form")) {
      suggestions.push("Analyze my technique improvement");
    }
    if (!suggestions.some((s) => s.includes("footwork"))) {
      suggestions.push("Focus on footwork drills");
    }
  } else if (plan === "weight-loss" && suggestions.length < 4) {
    if (responseLower.includes("meal") || responseLower.includes("food")) {
      suggestions.push("Look up calories for specific foods");
    }
    if (responseLower.includes("plateau") || responseLower.includes("stuck")) {
      suggestions.push("Break through weight loss plateau");
    }
    if (!suggestions.some((s) => s.includes("deficit"))) {
      suggestions.push("Adjust my calorie deficit");
    }
  } else if (plan === "muscle-gain" && suggestions.length < 4) {
    if (
      responseLower.includes("protein") ||
      responseLower.includes("nutrition")
    ) {
      suggestions.push("Optimize my muscle building nutrition");
    }
    if (responseLower.includes("plateau") || responseLower.includes("stuck")) {
      suggestions.push("Overcome strength plateau");
    }
    if (!suggestions.some((s) => s.includes("progressive"))) {
      suggestions.push("Plan progressive overload strategy");
    }
  }

  // Universal context-aware suggestions with comprehensive data awareness
  if (responseLower.includes("tool") || responseLower.includes("calculate")) {
    if (!suggestions.some((s) => s.includes("metrics"))) {
      suggestions.push("Calculate updated health metrics");
    }
  }

  if (responseLower.includes("plan") || responseLower.includes("routine")) {
    if (!hasActiveDiet && !suggestions.some((s) => s.includes("diet"))) {
      suggestions.push("Create comprehensive diet plan");
    }
    if (!hasActiveWorkout && !suggestions.some((s) => s.includes("workout"))) {
      suggestions.push("Design detailed workout routine");
    }
  }

  // Fill remaining slots with intelligent contextual suggestions
  const contextualSuggestions = [
    hasActiveDiet
      ? "Review and modify my diet plan"
      : "Create personalized diet plan",
    hasActiveWorkout
      ? "Analyze my workout performance"
      : "Design custom workout routine",
    hasProgressData
      ? "View comprehensive progress analysis"
      : "Start tracking my progress",
    profile?.fitnessGoal
      ? `Accelerate my ${profile.fitnessGoal} results`
      : "Define clear fitness goals",
    "Get evidence-based fitness advice",
    hasVectorResults
      ? "Explore more personalized content"
      : "Build my knowledge base",
    "What should I prioritize this week?",
    "Schedule my next milestone check-in",
  ];

  // Add contextual suggestions to fill remaining slots
  for (const suggestion of contextualSuggestions) {
    if (suggestions.length >= 4) break;
    if (
      !suggestions.includes(suggestion) &&
      !suggestions.some(
        (s) =>
          s.toLowerCase().includes(suggestion.split(" ")[0].toLowerCase()) ||
          suggestion.toLowerCase().includes(s.split(" ")[0].toLowerCase())
      )
    ) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.slice(0, 4); // Return max 4 suggestions
}

/**
 * Get default suggestions when response analysis fails
 */
function getDefaultSuggestions(plan) {
  const defaultSuggestions = {
    badminton: [
      "Show me basic badminton drills",
      "How do I improve my footwork?",
      "Help with my serve technique",
      "Create a training routine",
    ],
    "weight-loss": [
      "Calculate my daily calorie needs",
      "Create a weight loss meal plan",
      "What exercises burn the most calories?",
      "Track my weight progress",
    ],
    "muscle-gain": [
      "Calculate my bulking calories",
      "Create a muscle building workout",
      "How much protein do I need?",
      "Track my strength progress",
    ],
    general: [
      "Help me set fitness goals",
      "Create a workout plan",
      "Calculate my health metrics",
      "What should I focus on first?",
    ],
  };

  return defaultSuggestions[plan] || defaultSuggestions.general;
}

/**
 * LEGACY FUNCTION: Search fitness content using traditional methods
 * Kept for backward compatibility but enhanced with error handling
 */
async function searchFitnessContent(query, limit = 3) {
  try {
    // This would typically search a knowledge base
    // For now, return empty array to avoid errors
    console.log(
      "Legacy fitness content search called - consider migrating to vector search"
    );
    return [];
  } catch (error) {
    console.error("Error in legacy fitness content search:", error);
    return [];
  }
}

/**
 * Format search results for context (legacy compatibility)
 */
function formatSearchResultsForContext(results, maxLength = 500) {
  if (!results || results.length === 0) return "";

  let context = "\n=== FITNESS KNOWLEDGE ===\n";
  let remainingLength = maxLength - context.length;

  for (const result of results) {
    if (remainingLength <= 50) break;

    const resultText = `${result.title || "Fitness Tip"}: ${
      result.content || result.summary || ""
    }\n`;
    if (resultText.length <= remainingLength) {
      context += resultText;
      remainingLength -= resultText.length;
    }
  }

  return context;
}
