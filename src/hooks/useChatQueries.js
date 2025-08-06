// hooks/useChatQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CHAT_KEYS = {
  all: ['chats'],
  lists: () => [...CHAT_KEYS.all, 'list'],
  list: (userId) => [...CHAT_KEYS.lists(), userId],
  details: () => [...CHAT_KEYS.all, 'detail'],
  detail: (id) => [...CHAT_KEYS.details(), id],
};

// Fetch chat history
export const useChatHistory = (userId, options = {}) => {
  return useQuery({
    queryKey: CHAT_KEYS.list(userId),
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await axios.get(`/api/chat-history?userId=${userId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch chat history');
      }
      return response.data.chats || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Save new chat
export const useSaveChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, title, plan, messages }) => {
      if (!userId || !messages?.length) {
        throw new Error('Missing required fields');
      }
      
      // Sanitize messages to match schema
      const sanitizedMessages = messages.map(msg => ({
        role: msg.role || msg.type, // Handle both formats
        content: msg.content,
        timestamp: msg.timestamp || new Date(),
        suggestions: msg.suggestions || [],
        isError: msg.isError || false,
      }));

      const response = await axios.post('/api/chat-history', {
        userId,
        title: title || generateChatTitle(sanitizedMessages),
        plan: plan || 'general',
        messages: sanitizedMessages,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to save chat');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the chat list cache
      queryClient.setQueryData(
        CHAT_KEYS.list(variables.userId),
        (old = []) => [data.chat, ...old]
      );
      
      // Show success message
      toast.success('Chat saved successfully');
    },
    onError: (error) => {
      console.error('Error saving chat:', error);
      toast.error(error.message || 'Failed to save chat');
    },
  });
};

// Update existing chat
export const useUpdateChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chatId, messages, title }) => {
      if (!chatId || !messages?.length) {
        throw new Error('Missing required fields');
      }
      
      const sanitizedMessages = messages.map(msg => ({
        role: msg.role || msg.type,
        content: msg.content,
        timestamp: msg.timestamp || new Date(),
        suggestions: msg.suggestions || [],
        isError: msg.isError || false,
      }));
      
      const response = await axios.put('/api/chat-history', {
        chatId,
        messages: sanitizedMessages,
        ...(title && { title }),
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update chat');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update all relevant caches
      queryClient.invalidateQueries({ 
        queryKey: CHAT_KEYS.lists(),
        exact: false 
      });
    },
    onError: (error) => {
      console.error('Error updating chat:', error);
      toast.error(error.message || 'Failed to update chat');
    },
  });
};

// Delete chat
export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chatId) => {
      if (!chatId) {
        throw new Error('Chat ID is required');
      }
      
      const response = await axios.delete(`/api/chat-history?chatId=${chatId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete chat');
      }
      
      return response.data;
    },
    onSuccess: (data, chatId) => {
      // Remove from all chat list caches
      queryClient.setQueriesData(
        { queryKey: CHAT_KEYS.lists() },
        (old = []) => old.filter(chat => chat._id !== chatId)
      );
      
      toast.success('Chat deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting chat:', error);
      toast.error(error.message || 'Failed to delete chat');
    },
  });
};

// Send AI message
export const useSendMessage = () => {
  return useMutation({
    mutationFn: async ({ message, plan, conversationHistory, profile }) => {
      const response = await axios.post('/api/chat', {
        message,
        plan,
        conversationHistory,
        profile,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get AI response');
      }

      return response.data;
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    },
  });
};

// Utility function for generating chat titles
const generateChatTitle = (messages) => {
  const firstUserMessage = messages.find(msg => 
    msg.role === 'user' || msg.type === 'user'
  );
  
  if (firstUserMessage) {
    const title = firstUserMessage.content.substring(0, 50);
    return title.length < 50 ? title : title + '...';
  }
  return 'New Chat';
};

// Custom hook for managing chat state with React Query
export const useChatManager = (userId) => {
  const queryClient = useQueryClient();
  
  // Queries
  const { 
    data: chatHistory = [], 
    isLoading: historyLoading, 
    error: historyError 
  } = useChatHistory(userId);
  
  // Mutations
  const saveChatMutation = useSaveChat();
  const updateChatMutation = useUpdateChat();
  const deleteChatMutation = useDeleteChat();
  const sendMessageMutation = useSendMessage();
  
  // Helper functions
  const saveChat = async (title, plan, messages) => {
    try {
      const result = await saveChatMutation.mutateAsync({
        userId,
        title,
        plan,
        messages,
      });
      return result.chatId;
    } catch (error) {
      return null;
    }
  };
  
  const updateChat = async (chatId, messages, title) => {
    try {
      await updateChatMutation.mutateAsync({
        chatId,
        messages,
        title,
      });
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const deleteChat = async (chatId) => {
    try {
      await deleteChatMutation.mutateAsync(chatId);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const sendMessage = async (message, plan, conversationHistory, profile) => {
    try {
      const result = await sendMessageMutation.mutateAsync({
        message,
        plan,
        conversationHistory,
        profile,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  // Refresh chat history
  const refreshHistory = () => {
    queryClient.invalidateQueries({
      queryKey: CHAT_KEYS.list(userId),
    });
  };
  
  return {
    // Data
    chatHistory,
    
    // Loading states
    historyLoading,
    savingChat: saveChatMutation.isPending,
    updatingChat: updateChatMutation.isPending,
    deletingChat: deleteChatMutation.isPending,
    sendingMessage: sendMessageMutation.isPending,
    
    // Errors
    historyError,
    saveError: saveChatMutation.error,
    updateError: updateChatMutation.error,
    deleteError: deleteChatMutation.error,
    sendError: sendMessageMutation.error,
    
    // Actions
    saveChat,
    updateChat,
    deleteChat,
    sendMessage,
    refreshHistory,
    
    // Reset functions
    resetSaveError: saveChatMutation.reset,
    resetUpdateError: updateChatMutation.reset,
    resetDeleteError: deleteChatMutation.reset,
    resetSendError: sendMessageMutation.reset,
  };
};