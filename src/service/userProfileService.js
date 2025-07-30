// services/userProfileService.js
import { getAuth } from 'firebase/auth';

// Helper function to get current user token
const getCurrentUserToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? await user.getIdToken() : null;
};

export const userProfileService = {
  // Get user profile
  getUserProfile: async (userId) => {
    try {
      const token = await getCurrentUserToken();
      const response = await fetch('/api/userProfile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch profile');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error in getUserProfile service:', error);
      throw error;
    }
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