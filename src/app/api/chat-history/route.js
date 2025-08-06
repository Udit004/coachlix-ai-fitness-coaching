// app/api/chat-history/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import mongoose from 'mongoose';

// ✅ GET - Fetch chat history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    await connectDB();

    // Fetch chats from last 30 days, limited to 50 most recent
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const chats = await ChatSession.find({
      userId,
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo },
    })
    .sort({ updatedAt: -1 })
    .limit(50)
    .select('title plan messages messageCount lastMessage createdAt updatedAt')
    .lean(); // Use lean() for better performance

    return NextResponse.json({ 
      success: true, 
      chats: chats || [] 
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chat history' 
    }, { status: 500 });
  }
}

// ✅ POST - Save new chat
export async function POST(request) {
  try {
    const { userId, title, plan, messages } = await request.json();

    // Validation
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Messages array is required and cannot be empty' 
      }, { status: 400 });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !['user', 'ai'].includes(msg.role)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Each message must have a valid role (user or ai)' 
        }, { status: 400 });
      }
      if (!msg.content || typeof msg.content !== 'string') {
        return NextResponse.json({ 
          success: false, 
          error: 'Each message must have content' 
        }, { status: 400 });
      }
    }

    await connectDB();

    // Generate title if not provided
    const chatTitle = title || generateTitleFromMessages(messages);

    // Create chat session
    const chatSession = new ChatSession({
      userId,
      title: chatTitle,
      plan: plan || 'general',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        suggestions: msg.suggestions || [],
        isError: msg.isError || false
      })),
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 200) || '',
    });

    const savedChat = await chatSession.save();

    return NextResponse.json({
      success: true,
      chatId: savedChat._id.toString(),
      chat: savedChat,
      message: 'Chat saved successfully'
    });

  } catch (error) {
    console.error('Error saving chat:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format: ' + error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save chat' 
    }, { status: 500 });
  }
}

// ✅ PUT - Update existing chat
export async function PUT(request) {
  try {
    const { chatId, messages, title } = await request.json();

    // Validation
    if (!chatId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat ID is required' 
      }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Messages array is required and cannot be empty' 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid chat ID format' 
      }, { status: 400 });
    }

    await connectDB();

    // Check if chat exists
    const existingChat = await ChatSession.findById(chatId);
    if (!existingChat) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat not found' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        suggestions: msg.suggestions || [],
        isError: msg.isError || false
      })),
      updatedAt: new Date(),
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 200) || '',
    };

    // Update title if provided
    if (title && title.trim()) {
      updateData.title = title.trim();
    }

    // Update the chat
    const updatedChat = await ChatSession.findByIdAndUpdate(
      chatId, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Chat updated successfully',
      chat: updatedChat 
    });

  } catch (error) {
    console.error('Error updating chat:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format: ' + error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update chat' 
    }, { status: 500 });
  }
}

// ✅ DELETE - Remove chat
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({
        success: false,
        error: "Chat ID is required"
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({
        success: false,
        error: "Invalid chat ID format"
      }, { status: 400 });
    }

    await connectDB();

    // Check if chat exists before deleting
    const existingChat = await ChatSession.findById(chatId);
    if (!existingChat) {
      return NextResponse.json({
        success: false,
        error: "Chat not found"
      }, { status: 404 });
    }

    // Soft delete by setting isActive to false (recommended)
    // This preserves data for potential recovery
    await ChatSession.findByIdAndUpdate(chatId, { 
      isActive: false,
      updatedAt: new Date()
    });

    // Alternative: Hard delete (uncomment if you prefer)
    // await ChatSession.findByIdAndDelete(chatId);

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete chat"
    }, { status: 500 });
  }
}

// ✅ Helper function to generate title from messages
function generateTitleFromMessages(messages) {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  
  if (firstUserMessage && firstUserMessage.content) {
    // Clean up the content and create a title
    let title = firstUserMessage.content
      .trim()
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .substring(0, 50);
    
    return title.length < 50 ? title : title + '...';
  }
  
  return 'New Chat - ' + new Date().toLocaleDateString();
}