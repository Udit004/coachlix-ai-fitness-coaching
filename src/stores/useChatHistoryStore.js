// stores/useChatHistoryStore.js
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import axios from "axios";

const ITEMS_PER_PAGE = 20;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const useChatHistoryStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        chats: [],
        loading: false,
        error: null,
        hasMore: true,
        page: 1,
        totalCount: 0,
        lastFetch: null,

        // Filters & Search
        searchTerm: "",
        filterPlan: "all",
        sortBy: "newest", // newest, oldest, messages
        expandedDates: {},

        // Cache management
        userId: null,
        cacheTimestamp: null,

        // Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // Fetch chats with pagination
        fetchChats: async (userId, options = {}) => {
          const state = get();
          const { force = false, append = false } = options;

          // Check cache validity
          const now = Date.now();
          const isCacheValid =
            state.cacheTimestamp &&
            now - state.cacheTimestamp < CACHE_EXPIRY &&
            state.userId === userId;

          if (!force && isCacheValid && state.chats.length > 0) {
            console.log("📦 Using cached chat history");
            return;
          }

          if (!append) {
            set({ loading: true, error: null, page: 1 });
          }

          try {
            const response = await axios.get("/api/chat-history", {
              params: {
                userId,
                page: append ? state.page : 1,
                limit: ITEMS_PER_PAGE,
                sortBy: state.sortBy,
              },
            });

            if (response.data.success) {
              const { chats: newChats, totalCount, hasMore } = response.data;

              set({
                chats: append ? [...state.chats, ...newChats] : newChats,
                totalCount,
                hasMore,
                page: append ? state.page + 1 : 2,
                loading: false,
                error: null,
                userId,
                cacheTimestamp: now,
                lastFetch: now,
              });

              console.log(
                `✅ Fetched ${newChats.length} chats${
                  append ? " (appended)" : ""
                }`
              );
            } else {
              throw new Error(response.data.message || "Failed to fetch chats");
            }
          } catch (error) {
            console.error("Error fetching chats:", error);
            set({
              loading: false,
              error: error.message || "Failed to load chat history",
              ...(append ? {} : { chats: [] }),
            });
          }
        },

        // Load more chats (infinite scroll)
        loadMoreChats: async () => {
          const state = get();
          if (!state.hasMore || state.loading) return;

          await state.fetchChats(state.userId, { append: true });
        },

        // Save new chat
        saveChat: async (userId, title, plan, messages) => {
          try {
            const sanitizedMessages = messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp || new Date(),
            }));

            const response = await axios.post("/api/chat-history", {
              userId,
              title: title || get().generateChatTitle(sanitizedMessages),
              plan,
              messages: sanitizedMessages,
            });

            if (response.data.success) {
              const newChat = response.data.chat;
              set((state) => ({
                chats: [newChat, ...state.chats],
                totalCount: state.totalCount + 1,
                cacheTimestamp: Date.now(),
              }));

              console.log("✅ Chat saved:", newChat.title);
              return response.data.chatId;
            }
          } catch (error) {
            console.error("Error saving chat:", error);
            set({ error: "Failed to save chat" });
          }
          return null;
        },

        // Update existing chat
        updateChat: async (chatId, messages, title = null) => {
          try {
            const sanitizedMessages = messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp || new Date(),
            }));

            await axios.put("/api/chat-history", {
              chatId,
              messages: sanitizedMessages,
              title,
            });

            set((state) => ({
              chats: state.chats.map((chat) =>
                chat._id === chatId
                  ? {
                      ...chat,
                      messages: sanitizedMessages,
                      updatedAt: new Date(),
                      messageCount: sanitizedMessages.length,
                      lastMessage:
                        sanitizedMessages[
                          sanitizedMessages.length - 1
                        ]?.content?.substring(0, 100) || "",
                      ...(title && { title }),
                    }
                  : chat
              ),
              cacheTimestamp: Date.now(),
            }));

            console.log("✅ Chat updated:", chatId);
          } catch (error) {
            console.error("Error updating chat:", error);
            set({ error: "Failed to update chat" });
          }
        },

        // Delete chat
        deleteChat: async (chatId) => {
          try {
            await axios.delete(`/api/chat-history?chatId=${chatId}`);

            set((state) => ({
              chats: state.chats.filter((chat) => chat._id !== chatId),
              totalCount: Math.max(0, state.totalCount - 1),
              cacheTimestamp: Date.now(),
            }));

            console.log("✅ Chat deleted:", chatId);
          } catch (error) {
            console.error("Error deleting chat:", error);
            set({ error: "Failed to delete chat" });
          }
        },

        // Pin/Unpin chat
        pinChat: async (chatId) => {
          try {
            const state = get();
            const chat = state.chats.find((c) => c._id === chatId);
            if (!chat) return;

            const newPinnedStatus = !chat.isPinned;

            await axios.patch(`/api/chat-history/${chatId}`, {
              isPinned: newPinnedStatus,
            });

            set((state) => ({
              chats: state.chats
                .map((chat) =>
                  chat._id === chatId
                    ? {
                        ...chat,
                        isPinned: newPinnedStatus,
                        updatedAt: new Date(),
                      }
                    : chat
                )
                .sort((a, b) => {
                  // Keep pinned chats at top
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return new Date(b.updatedAt) - new Date(a.updatedAt);
                }),
              cacheTimestamp: Date.now(),
            }));

            console.log(
              `✅ Chat ${newPinnedStatus ? "pinned" : "unpinned"}:`,
              chatId
            );
          } catch (error) {
            console.error("Error pinning chat:", error);
            set({ error: "Failed to pin chat" });
          }
        },

        // Archive chat
        archiveChat: async (chatId) => {
          try {
            const state = get();
            const chat = state.chats.find((c) => c._id === chatId);
            if (!chat) return;

            const newArchivedStatus = !chat.isArchived;

            await axios.patch(`/api/chat-history/${chatId}`, {
              isArchived: newArchivedStatus,
            });

            set((state) => ({
              chats: state.chats.map((chat) =>
                chat._id === chatId
                  ? {
                      ...chat,
                      isArchived: newArchivedStatus,
                      updatedAt: new Date(),
                    }
                  : chat
              ),
              cacheTimestamp: Date.now(),
            }));

            console.log(
              `✅ Chat ${newArchivedStatus ? "archived" : "unarchived"}:`,
              chatId
            );
          } catch (error) {
            console.error("Error archiving chat:", error);
            set({ error: "Failed to archive chat" });
          }
        },

        // Search and filter actions
        setSearchTerm: (searchTerm) => set({ searchTerm }),
        setFilterPlan: (filterPlan) => set({ filterPlan }),
        setSortBy: async (sortBy) => {
          set({ sortBy });
          // Refetch with new sort order
          const state = get();
          if (state.userId) {
            await state.fetchChats(state.userId, { force: true });
          }
        },

        clearSearch: () => set({ searchTerm: "", filterPlan: "all" }),

        // Date group expansion
        toggleDateGroup: (date) => {
          set((state) => ({
            expandedDates: {
              ...state.expandedDates,
              [date]: state.expandedDates[date] === false ? true : false,
            },
          }));
        },

        // Utility functions
        generateChatTitle: (messages) => {
          const firstUserMessage = messages.find((msg) => msg.role === "user");
          if (firstUserMessage) {
            const title = firstUserMessage.content.substring(0, 50);
            return title.length < 50 ? title : title + "...";
          }
          return "New Chat";
        },

        // Retry failed operations
        retryFetch: async (userId) => {
          await get().fetchChats(userId, { force: true });
        },

        // Clear cache
        clearCache: () => {
          set({
            chats: [],
            cacheTimestamp: null,
            lastFetch: null,
            page: 1,
            hasMore: true,
            totalCount: 0,
          });
        },

        // Mark chat as read/new
        markChatAsRead: (chatId) => {
          set((state) => ({
            chats: state.chats.map((chat) =>
              chat._id === chatId ? { ...chat, isNew: false } : chat
            ),
          }));
        },

        // Bulk operations
        bulkDeleteChats: async (chatIds) => {
          try {
            await axios.post("/api/chat-history/bulk-delete", { chatIds });

            set((state) => ({
              chats: state.chats.filter((chat) => !chatIds.includes(chat._id)),
              totalCount: Math.max(0, state.totalCount - chatIds.length),
              cacheTimestamp: Date.now(),
            }));

            console.log("✅ Bulk deleted chats:", chatIds.length);
          } catch (error) {
            console.error("Error bulk deleting chats:", error);
            set({ error: "Failed to delete chats" });
          }
        },

        // Get chat by ID
        getChatById: (chatId) => {
          return get().chats.find((chat) => chat._id === chatId);
        },

        // Get recent chats (for quick access)
        getRecentChats: (limit = 5) => {
          const state = get();
          if (!state.chats || state.chats.length === 0) return [];

          return state.chats.filter((chat) => !chat.isArchived).slice(0, limit);
        },

        // Also add this method to provide stable stats:
        getChatStats: () => {
          const state = get();
          const chats = state.chats || [];

          if (chats.length === 0) return null;

          const totalMessages = chats.reduce(
            (sum, chat) =>
              sum + (chat.messages?.length || chat.messageCount || 0),
            0
          );
          const pinnedChats = chats.filter((chat) => chat.isPinned).length;

          return {
            totalChats: chats.length,
            totalMessages,
            pinnedChats,
          };
        },

        // Get pinned chats
        getPinnedChats: () => {
          return get().chats.filter(
            (chat) => chat.isPinned && !chat.isArchived
          );
        },

        // Statistics
        getStats: () => {
          const state = get();
          const totalChats = state.chats.length;
          const pinnedChats = state.chats.filter((c) => c.isPinned).length;
          const archivedChats = state.chats.filter((c) => c.isArchived).length;
          const totalMessages = state.chats.reduce(
            (sum, chat) => sum + (chat.messageCount || 0),
            0
          );

          return {
            totalChats,
            pinnedChats,
            archivedChats,
            totalMessages,
            averageMessagesPerChat:
              totalChats > 0 ? Math.round(totalMessages / totalChats) : 0,
          };
        },

        // Reset store
        reset: () => {
          set({
            chats: [],
            loading: false,
            error: null,
            hasMore: true,
            page: 1,
            totalCount: 0,
            lastFetch: null,
            searchTerm: "",
            filterPlan: "all",
            sortBy: "newest",
            expandedDates: {},
            userId: null,
            cacheTimestamp: null,
          });
        },
      }),
      {
        name: "chat-history-store",
        partialize: (state) => ({
          // Only persist essential data
          expandedDates: state.expandedDates,
          sortBy: state.sortBy,
          filterPlan: state.filterPlan,
        }),
      }
    ),
    {
      name: "chat-history-store",
    }
  )
);

export default useChatHistoryStore;
