import axios from "axios";
import { getAuth } from "firebase/auth";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

const getCurrentUserToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? await user.getIdToken() : null;
};

const withAuthHeaders = async (extraHeaders = {}) => {
  const token = await getCurrentUserToken();
  if (!token) throw new Error("No authentication token available. Please log in again.");
  return {
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
};

const mapAxiosError = (error, fallbackMessage) => {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;
  return new Error(message);
};

export const userProfileService = {
  getUserProfile: async (userId, retries = 2) => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }

        const headers = await withAuthHeaders({ "Content-Type": "application/json" });
        const response = await api.get("/userProfile", {
          headers,
          params: { _ts: Date.now() },
        });

        if (!response?.data?.success) {
          throw new Error(response?.data?.error || response?.data?.details || "Failed to fetch profile");
        }

        return response.data.data;
      } catch (error) {
        lastError = mapAxiosError(error, "Failed to fetch profile");

        const msg = lastError.message.toLowerCase();
        if (msg.includes("authentication") || msg.includes("session") || msg.includes("log in")) {
          break;
        }
      }
    }

    throw lastError;
  },

  updateUserProfile: async (userId, updates) => {
    try {
      const headers = await withAuthHeaders({ "Content-Type": "application/json" });
      const response = await api.put("/userProfile", updates, { headers });

      if (!response?.data?.success) {
        throw new Error(response?.data?.error || "Failed to update profile");
      }

      return response.data.data;
    } catch (error) {
      throw mapAxiosError(error, "Failed to update profile");
    }
  },

  uploadProfileImage: async (userId, imageFile) => {
    try {
      const headers = await withAuthHeaders();
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await api.post("/userProfile/image", formData, {
        headers,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.error || "Failed to upload image");
      }

      return response.data.imageUrl;
    } catch (error) {
      throw mapAxiosError(error, "Failed to upload profile image");
    }
  },
};