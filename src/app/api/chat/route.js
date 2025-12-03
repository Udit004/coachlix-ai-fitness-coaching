// app/api/chat/route.js — SSE VERSION with Professional Conversational Flow

import { NextResponse } from "next/server";
import { processChatWithProfessionalFlow } from "@/ai/orchestrator-professional-flow";
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
          // 2) Process Chat Message with Professional Flow Orchestrator
          // -------------------------
          console.log(`[Chat Route] Using Professional Conversational Flow orchestrator`);
          
          let fullResponse = "";
          
          const result = await processChatWithProfessionalFlow(
            {
              message,
              plan,
              conversationHistory,
              profile,
              userId,
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
          
          // Validate response before proceeding
          if (!fullResponse || fullResponse.trim().length === 0) {
            console.error('[Chat Route] ❌ Empty response received from orchestrator');
            fullResponse = "I'm having trouble generating a response. Please try again.";
          }

          // -------------------------
          // 3) Log Optimization Metrics
          // -------------------------
          console.log('[Chat Route] Metrics:', {
            architecture: result.metadata?.architecture,
            llmCalls: result.metadata?.llmCalls,
            timeTaken: result.metadata?.timeTaken,
            toolsUsed: result.metadata?.toolsUsed,
            responseLength: fullResponse?.length || 0
          });

          // -------------------------
          // 4) Send Final Complete Event
          // -------------------------
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                fullResponse: fullResponse,
                suggestions: [], // TODO: Implement suggestions if needed
                metadata: {
                  llmCalls: result.metadata?.llmCalls,
                  timeTaken: result.metadata?.timeTaken
                }
              })}\n\n`
            )
          );

          // -------------------------
          // 5) Save Message to Database
          // -------------------------
          try {
            await addToHistory(userId, [
              { role: "user", content: message },
              { role: "ai", content: fullResponse },
            ]);
            console.log('[Chat Route] ✅ Conversation saved to history');
          } catch (historyError) {
            console.error('[Chat Route] ❌ Failed to save to history:', historyError);
            // Don't fail the request if history save fails
          }

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
