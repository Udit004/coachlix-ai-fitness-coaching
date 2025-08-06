// stores/useChatStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useChatStore = create()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Chat state
      messages: [],
      currentChatId: null,
      selectedPlan: 'general',
      isNewChat: true,
      isTyping: false,
      
      // UI state
      sidebarOpen: false,
      showHistory: false,
      inputValue: '',
      
      // Error handling
      error: null,
      
      // Actions
      setMessages: (messages) =>
        set((state) => {
          state.messages = messages;
        }),
      
      addMessage: (message) =>
        set((state) => {
          state.messages.push({
            ...message,
            id: message.id || Date.now(),
            timestamp: message.timestamp || new Date(),
          });
        }),
      
      updateLastMessage: (updates) =>
        set((state) => {
          if (state.messages.length > 0) {
            const lastIndex = state.messages.length - 1;
            Object.assign(state.messages[lastIndex], updates);
          }
        }),
      
      setCurrentChatId: (chatId) =>
        set((state) => {
          state.currentChatId = chatId;
          state.isNewChat = !chatId;
        }),
      
      setSelectedPlan: (plan) =>
        set((state) => {
          state.selectedPlan = plan;
        }),
      
      setIsNewChat: (isNew) =>
        set((state) => {
          state.isNewChat = isNew;
          if (isNew) {
            state.currentChatId = null;
          }
        }),
      
      setIsTyping: (typing) =>
        set((state) => {
          state.isTyping = typing;
        }),
      
      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),
      
      setShowHistory: (show) =>
        set((state) => {
          state.showHistory = show;
        }),
      
      setInputValue: (value) =>
        set((state) => {
          state.inputValue = value;
        }),
      
      setError: (error) =>
        set((state) => {
          state.error = error;
        }),
      
      clearError: () =>
        set((state) => {
          state.error = null;
        }),
      
      // Chat management actions
      startNewChat: () =>
        set((state) => {
          state.messages = [];
          state.currentChatId = null;
          state.isNewChat = true;
          state.selectedPlan = 'general';
          state.showHistory = false;
          state.error = null;
        }),
      
      loadChat: (chat) =>
        set((state) => {
          state.messages = chat.messages || [];
          state.currentChatId = chat._id;
          state.selectedPlan = chat.plan || 'general';
          state.isNewChat = false;
          state.showHistory = false;
          state.error = null;
        }),
      
      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),
      
      toggleHistory: () =>
        set((state) => {
          state.showHistory = !state.showHistory;
        }),
      
      // Message helpers
      getUserMessages: () => {
        const { messages } = get();
        return messages.filter(msg => msg.role === 'user' || msg.type === 'user');
      },
      
      getAiMessages: () => {
        const { messages } = get();
        return messages.filter(msg => msg.role === 'ai' || msg.type === 'ai');
      },
      
      getLastUserMessage: () => {
        const userMessages = get().getUserMessages();
        return userMessages[userMessages.length - 1] || null;
      },
      
      getLastAiMessage: () => {
        const aiMessages = get().getAiMessages();
        return aiMessages[aiMessages.length - 1] || null;
      },
      
      // Utility functions
      generateChatTitle: (messages = null) => {
        const chatMessages = messages || get().messages;
        const firstUserMessage = chatMessages.find(msg => 
          msg.role === 'user' || msg.type === 'user'
        );
        
        if (firstUserMessage) {
          const title = firstUserMessage.content.substring(0, 50);
          return title.length < 50 ? title : title + '...';
        }
        return 'New Chat';
      },
      
      // Reset store
      reset: () =>
        set((state) => {
          state.messages = [];
          state.currentChatId = null;
          state.selectedPlan = 'general';
          state.isNewChat = true;
          state.isTyping = false;
          state.sidebarOpen = false;
          state.showHistory = false;
          state.inputValue = '';
          state.error = null;
        }),
    }))
  )
);

export default useChatStore;