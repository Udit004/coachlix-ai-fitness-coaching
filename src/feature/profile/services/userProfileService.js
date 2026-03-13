// services/userProfileService.js
import { getAuth } from 'firebase/auth';

const PROFILE_CACHE_PREFIX = 'user-profile:';
const CACHE_EXPIRATION_SECONDS = 900; // 15 minutes

// Helper function to get current user token
const getCurrentUserToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? await user.getIdToken() : null;
};

export const userProfileService = {
  // Get user profile with retry logic
  getUserProfile: async (userId, retries = 2) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${retries} for user profile`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        // Fetch from API directly (Redis caching should be handled server-side)
        const token = await getCurrentUserToken();
        
        if (!token) {
          throw new Error('No authentication token available. Please log in again.');
        }
        
        const response = await fetch('/api/userProfile', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        // Handle different HTTP status codes
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status === 404) {
          throw new Error('Profile not found. Creating a new profile...');
        }
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || data.details || 'Failed to fetch profile');
        }
        
        console.log('✅ Profile loaded successfully');
        return data.data;
        
      } catch (error) {
        console.error(`❌ Error fetching profile (attempt ${attempt + 1}):`, error);
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.message.includes('authentication') || 
            error.message.includes('session') ||
            error.message.includes('log in')) {
          break;
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError;
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
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
      
      return data.data;
    } catch (error) {
      console.error('Error in updateUserProfile service:', error);
      throw error;
    }
  },

  // Upload profile image
  uploadProfileImage: async (userId, imageFile) => {
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
      
      return data.imageUrl;
    } catch (error) {
      console.error('Error in uploadProfileImage service:', error);
      throw error;
    }
  }
};