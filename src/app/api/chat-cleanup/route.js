// api/chat-cleanup/route.js
import { NextResponse } from "next/server";
import { connectDB }  from "@/lib/db"; // Adjust path as needed

// This API route should be called by a cron job or scheduled task
export async function POST(request) {
  try {
    const { db } = await connectDB();
    
    // Delete chats older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db.collection('chat_sessions').deleteMany({
      createdAt: { $lt: sevenDaysAgo }
    });

    console.log(`Cleaned up ${result.deletedCount} old chat sessions`);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} old chats`
    });

  } catch (error) {
    console.error("Error cleaning up old chats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cleanup old chats" },
      { status: 500 }
    );
  }
}

// Optional: Add GET method to check what would be deleted
export async function GET(request) {
  try {
    const { db } = await connectDB();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const count = await db.collection('chat_sessions').countDocuments({
      createdAt: { $lt: sevenDaysAgo }
    });

    return NextResponse.json({
      success: true,
      oldChatsCount: count,
      cutoffDate: sevenDaysAgo
    });

  } catch (error) {
    console.error("Error checking old chats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check old chats" },
      { status: 500 }
    );
  }
}