import { auth } from "@/lib/firebase";
import { buildApiUrl } from "@/service/apiBase";

export const CHAT_API_BASE_URL = buildApiUrl("chat");

export const getAuthHeaders = async () => {
  let user = auth.currentUser;
  if (!user) {
    for (let attempt = 0; attempt < 5 && !user; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      user = auth.currentUser;
    }
  }
  if (!user) throw new Error("User not authenticated");
  const token = await user.getIdToken(true);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
};

export const getChatHistory = async (limit = 50) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CHAT_API_BASE_URL}?limit=${limit}`, {
    method: "GET",
    headers,
  });
  return handleResponse(response);
};

export const getChatSession = async (chatId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CHAT_API_BASE_URL}/${chatId}`, {
    method: "GET",
    headers,
  });
  return handleResponse(response);
};

export const createChatSession = async ({ title, plan = "general", messages = [] }) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CHAT_API_BASE_URL}/session`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, plan, messages }),
  });
  return handleResponse(response);
};

export const updateChatSession = async ({ chatId, ...updates }) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CHAT_API_BASE_URL}/${chatId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
};

export const deleteChatSession = async (chatId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CHAT_API_BASE_URL}/${chatId}`, {
    method: "DELETE",
    headers,
  });
  return handleResponse(response);
};

export const clearChatHistory = async (chatId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CHAT_API_BASE_URL}/${chatId}/clear`, {
    method: "POST",
    headers,
  });
  return handleResponse(response);
};
