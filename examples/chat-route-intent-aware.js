// Example: How to update your chat route to use intent-aware context loading
// This is a reference implementation - copy the relevant parts to your actual route.js

import { NextResponse } from "next/server";
import { processChatMessageStreaming } from "@/ai/orchestrator";
import { addToHistory } from "@/ai/memory";

// Initialize LangSmith tracing (if enabled in env)
import "@/ai/config/langsmith";

// ============================================================
//                    POST → ALWAYS SSE STREAMING
// ============================================================
export async function POST(request) {
  try {
    const { message, plan, conversationHistory, profile, userId } =
      await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { success: false, error: "Message and userId are required" },
        { status: 400 }
      );
    }

    return handleStreamingResponse({
      message,
      plan,
      conversationHistory,
      profile,
      userId,
    });
  } catch (err) {
    console.error("Request Error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request data" },
      { status: 400 }
    );
  }
}

// ============================================================
//                 SSE STREAMING RESPONSE HANDLER
//          WITH INTENT-AWARE CONTEXT LOADING
// ============================================================
async function handleStreamingResponse({
  message,
  plan,
  conversationHistory,
  profile,
  userId
}) {
  try {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // -------------------------
          // 1) Send Initial SSE Connection Event
          // -------------------------
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "connection",
                message: "SSE connection established",
              })}\n\n`
            )
          );

          // -------------------------
          // 2) Process Chat Message with Intent-Aware AI Orchestrator
          // -------------------------
          let fullResponse = "";
          let intentMetadata = null;
          
          // OPTION 1: Use intent-aware processing (RECOMMENDED)
          const result = await processChatMessageStreaming(
            {
              message,
              plan,
              conversationHistory,
              profile,
              userId,
              useIntentRouting: true,  // 🎯 Enable intent-aware context loading
            },
            // Streaming callback - sends each word as it's generated
            async (chunk) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "word",
                    word: chunk.word,
                    partialResponse: chunk.partialResponse,
                    isComplete: chunk.isComplete,
                  })}\n\n`
                )
              );
            }
          );

          fullResponse = result.response;
          intentMetadata = result.metadata?.intentClassification;

          // -------------------------
          // 3) Send Intent Classification Info (Optional)
          // -------------------------
          if (intentMetadata) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "metadata",
                  intent: intentMetadata.category,
                  confidence: intentMetadata.confidence,
                  tokenSavings: result.metadata?.tokenSavings,
                })}\n\n`
              )
            );
          }

          // -------------------------
          // 4) Send Final Complete Event
          // -------------------------
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                fullResponse: fullResponse,
                suggestions: [],
                metadata: {
                  intent: intentMetadata?.category,
                  confidence: intentMetadata?.confidence,
                }
              })}\n\n`
            )
          );

          // -------------------------
          // 5) Save Message to Database
          // -------------------------
          await addToHistory(userId, [
            { role: "user", content: message },
            { role: "ai", content: fullResponse },
          ]);

        } catch (err) {
          console.error("Streaming error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: err.message || "Unexpected streaming error occurred.",
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
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("SSE Setup Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to start SSE" },
      { status: 500 }
    );
  }
}

// ============================================================
//                 ALTERNATIVE: NON-STREAMING VERSION
//          WITH INTENT-AWARE CONTEXT LOADING
// ============================================================
export async function POST_NON_STREAMING(request) {
  try {
    const { message, plan, conversationHistory, profile, userId } =
      await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { success: false, error: "Message and userId are required" },
        { status: 400 }
      );
    }

    // Import the intent-aware processor
    const { processChatMessageWithIntent } = await import("@/ai/orchestrator");

    // Process with intent-aware context loading
    const result = await processChatMessageWithIntent({
      message,
      plan,
      conversationHistory,
      profile,
      userId,
      useIntentRouting: true,  // 🎯 Enable intent-aware context loading
    });

    // Save to history
    await addToHistory(userId, [
      { role: "user", content: message },
      { role: "ai", content: result.response },
    ]);

    // Return response with metadata
    return NextResponse.json({
      success: true,
      response: result.response,
      metadata: {
        intent: result.metadata?.intentClassification?.category,
        confidence: result.metadata?.intentClassification?.confidence,
        tokenSavings: result.metadata?.tokenSavings,
        contextsLoaded: result.metadata?.userContext?.contextsLoaded,
      }
    });

  } catch (err) {
    console.error("Chat Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process chat" },
      { status: 500 }
    );
  }
}
