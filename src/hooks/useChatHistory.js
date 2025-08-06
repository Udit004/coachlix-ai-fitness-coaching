import { useState, useEffect } from 'react';
import axios from 'axios';

export const useChatHistory = (userId) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch chat history
  const fetchChatHistory = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/chat-history?userId=${userId}`);
      if (response.data.success) {
        setChatHistory(response.data.chats);
      } else {
        setError('Failed to fetch chat history');
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  // Save new chat
  const saveChat = async (title, plan, messages) => {
    if (!userId || !messages.length) return null;

    // ✅ Sanitize messages to match schema
    const sanitizedMessages = messages.map(msg => ({
      role: msg.role, // must be "user" or "ai"
      content: msg.content,
      timestamp: msg.timestamp || new Date()
    }));

    try {
      const response = await axios.post('/api/chat-history', {
        userId,
        title: title || generateChatTitle(sanitizedMessages),
        plan,
        messages: sanitizedMessages
      });
      
      if (response.data.success) {
        setChatHistory(prev => [response.data.chat, ...prev]);
        return response.data.chatId;
      }
    } catch (err) {
      console.error('Error saving chat:', err);
      setError('Failed to save chat');
    }
    return null;
  };

  // Update existing chat
  const updateChat = async (chatId, messages, title = null) => {
    if (!chatId || !messages.length) return;

    const sanitizedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || new Date()
    }));
    
    try {
      await axios.put('/api/chat-history', {
        chatId,
        messages: sanitizedMessages,
        title
      });

      setChatHistory(prev => 
        prev.map(chat => 
          chat._id === chatId 
            ? { 
                ...chat, 
                messages: sanitizedMessages, 
                updatedAt: new Date(),
                messageCount: sanitizedMessages.length,
                lastMessage: sanitizedMessages[sanitizedMessages.length - 1]?.content?.substring(0, 100) || "",
                ...(title && { title })
              }
            : chat
        )
      );
    } catch (err) {
      console.error('Error updating chat:', err);
      setError('Failed to update chat');
    }
  };

  // Delete chat
  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`/api/chat-history?chatId=${chatId}`);
      setChatHistory(prev => prev.filter(chat => chat._id !== chatId));
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError('Failed to delete chat');
    }
  };

  // ✅ Corrected to use `role` instead of `type`
  const generateChatTitle = (messages) => {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.substring(0, 50);
      return title.length < 50 ? title : title + '...';
    }
    return 'New Chat';
  };

  useEffect(() => {
    fetchChatHistory();
  }, [userId]);

  return {
    chatHistory,
    loading,
    error,
    fetchChatHistory,
    saveChat,
    updateChat,
    deleteChat,
    generateChatTitle
  };
};
