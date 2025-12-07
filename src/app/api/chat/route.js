// app/api/chat/route.js — SSE VERSION with Professional Conversational Flow

import { NextResponse } from "next/server";
import { processChatWithProfessionalFlow } from "@/ai/orchestrator-professional-flow";
import { addToHistory, getHistory } from "@/ai/memory";
import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";

// Initialize LangSmith tracing (if enabled in env)
import "@/ai/config/langsmith";

// ============================================================
//                    POST → ALWAYS SSE STREAMING
// ============================================================
export async function POST(request) {
  try {
    const { message, plan, chatId, userId, files } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { success: false, error: "Message and userId are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Fetch conversation history from MongoDB (if chatId exists)
    let conversationHistory = [];
    if (chatId) {
      try {
        console.log(`[Chat Route] Fetching history for chatId: ${chatId}`);
        const chatSession = await ChatSession.findById(chatId);
        
        if (chatSession) {
          conversationHistory = chatSession.messages || [];
          console.log(`[Chat Route] ✅ Loaded ${conversationHistory.length} messages from database`);
        } else {
          console.log(`[Chat Route] ⚠️ Chat ${chatId} not found, starting fresh`);
        }
      } catch (dbError) {
        console.error('[Chat Route] ❌ Error fetching chat history:', dbError);
        // Continue with empty history if fetch fails
      }
    }

    // Fetch user profile from MongoDB
    let profile = null;
    try {
      console.log(`[Chat Route] Fetching profile for userId: ${userId}`);
      const User = (await import('@/models/userProfileModel')).default;
      const user = await User.findOne({ firebaseUid: userId });
      
      if (user) {
        profile = {
          name: user.name,
          email: user.email,
          fitnessGoal: user.fitnessGoal,
          experience: user.experience,
          gender: user.gender,
          activityLevel: user.activityLevel,
          age: user.age,
          height: user.height,
          weight: user.weight,
          targetWeight: user.targetWeight,
          bio: user.bio,
        };
        console.log(`[Chat Route] ✅ Loaded user profile for ${user.name}`);
      } else {
        console.log(`[Chat Route] ⚠️ User profile not found for ${userId}`);
      }
    } catch (profileError) {
      console.error('[Chat Route] ❌ Error fetching profile:', profileError);
      // Continue without profile if fetch fails
    }

    // Log multimodal content if files are present
    if (files && files.length > 0) {
      console.log(`[Chat Route] Multimodal request: ${files.length} file(s) attached`);
      files.forEach((file, index) => {
        console.log(`  File ${index + 1}: ${file.name} (${file.category})`);
      });
    }

    console.log(`[Chat Route] Request summary:`, {
      hasHistory: conversationHistory.length > 0,
      historyLength: conversationHistory.length,
      hasProfile: !!profile,
      hasFiles: files && files.length > 0
    });

    return handleStreamingResponse({
      message,
      plan,
      conversationHistory,  // From MongoDB
      profile,              // From MongoDB or Firebase Auth
      userId,
      files,
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
  userId,
  files
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
              files, // Pass files to orchestrator for multimodal processing
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
