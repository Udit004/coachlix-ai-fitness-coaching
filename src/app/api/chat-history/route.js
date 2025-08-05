// api/chat-history/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; // Adjust path as needed

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    // Get chats from last 7 days only
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chats = await db.collection('chat_sessions')
      .find({
        userId: userId,
        createdAt: { $gte: sevenDaysAgo }
      })
      .sort({ updatedAt: -1 }) // Most recent first
      .limit(50) // Limit to 50 recent chats
      .toArray();

    return NextResponse.json({
      success: true,
      chats: chats
    });

  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId, title, plan, messages } = await request.json();

    if (!userId || !messages) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    const chatSession = {
      userId: userId,
      title: title || "New Chat",
      plan: plan || "general",
      messages: messages,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100) || ""
    };

    const result = await db.collection('chat_sessions').insertOne(chatSession);

    return NextResponse.json({
      success: true,
      chatId: result.insertedId.toString(),
      chat: { ...chatSession, _id: result.insertedId }
    });

  } catch (error) {
    console.error("Error saving chat:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save chat" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { chatId, messages, title } = await request.json();

    if (!chatId || !messages) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    const { ObjectId } = require('mongodb');

    const updateData = {
      messages: messages,
      updatedAt: new Date(),
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100) || ""
    };

    if (title) {
      updateData.title = title;
    }

    await db.collection('chat_sessions').updateOne(
      { _id: new ObjectId(chatId) },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: "Chat updated successfully"
    });

  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    const { ObjectId } = require('mongodb');

    await db.collection('chat_sessions').deleteOne({
      _id: new ObjectId(chatId)
    });

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}