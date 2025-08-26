// services/userProfileService.js
import { getAuth } from 'firebase/auth';

// Helper function to get current user token
const getCurrentUserToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? await user.getIdToken() : null;
};


// services/userProfileService.js
import { getAuth } from 'firebase/auth';
import redis from '../lib/redis'; // Import the Redis client

const PROFILE_CACHE_PREFIX = 'user-profile:';
const CACHE_EXPIRATION_SECONDS = 900; // 15 minutes

// Helper function to get current user token
const getCurrentUserToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? await user.getIdToken() : null;
};

export const userProfileService = {
  // Get user profile
  getUserProfile: async (userId) => {
    const cacheKey = `${PROFILE_CACHE_PREFIX}${userId}`;

    try {
      // 1. Try to fetch from cache first
      if (redis) {
        const cachedProfile = await redis.get(cacheKey);
        if (cachedProfile) {
          console.log(`CACHE HIT for key: ${cacheKey}`);
          return JSON.parse(cachedProfile);
        }
      }
      console.log(`CACHE MISS for key: ${cacheKey}`);

      // 2. If not in cache, fetch from API
      const token = await getCurrentUserToken();
      const response = await fetch('/api/userProfile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      // 3. Store the result in the cache
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(data.data), 'EX', CACHE_EXPIRATION_SECONDS);
      }
      
      return data.data;
    } catch (error) {
      console.error('Error in getUserProfile service:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    const cacheKey = `${PROFILE_CACHE_PREFIX}${userId}`;

    try {
      const token = await getCurrentUserToken();
      const response = await fetch('/api/userProfile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Invalidate the cache after a successful update
      if (redis) {
        await redis.del(cacheKey);
        console.log(`CACHE INVALIDATED for key: ${cacheKey}`);
      }
      
      return data.data;
    } catch (error) {
      console.error('Error in updateUserProfile service:', error);
      throw error;
    }
  },

  // Upload profile image
  uploadProfileImage: async (userId, imageFile) => {
    const cacheKey = `${PROFILE_CACHE_PREFIX}${userId}`;

    try {
      const token = await getCurrentUserToken();
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/userProfile/image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Invalidate the cache after a successful upload
      if (redis) {
        await redis.del(cacheKey);
        console.log(`CACHE INVALIDATED for key: ${cacheKey}`);
      }
      
      return data.imageUrl;
    } catch (error) {
      console.error('Error in uploadProfileImage service:', error);
      throw error;
    }
  }
};