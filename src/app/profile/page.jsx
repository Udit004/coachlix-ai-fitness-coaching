"use client";
import { useState, useEffect } from "react";
import useUserProfileStore from "@/stores/useUserProfileStore";
import { useAuthContext } from "../../auth/AuthContext";
import { useRouter } from "next/navigation";
import { User, Bell, Settings } from "lucide-react";

// Import components
import ProfileSidebar from "./ProfileSidebar";
import ProfileTabs from "./ProfileTabs";
import ProfileTabContent from "./ProfileTabContent";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tempData, setTempData] = useState(null);

  const {
    profile: profileData,
    loading: profileLoading,
    error: profileError,
    fetchUserProfile,
    updateProfile,
    uploadProfileImage,
    hasValidProfile,
    clearError,
  } = useUserProfileStore();

  const [success, setSuccess] = useState(null);

  // Fetch profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;
      if (!authUser) return;

      if (profileError) {
        clearError();
      }

      try {
        const userId = authUser.uid;

        if (hasValidProfile() && profileData) {
          console.log("📦 Using existing profile data from store");
          
          // Check if needs onboarding
          if (profileData.needsOnboarding) {
            console.log("🔀 Redirecting to onboarding...");
            router.push('/onboarding');
            return;
          }
          
          setTempData(profileData);
          return;
        }

        if (!profileLoading) {
          const profile = await fetchUserProfile(userId);
          
          // Check if needs onboarding
          if (profile?.needsOnboarding) {
            console.log("🔀 Redirecting to onboarding...");
            router.push('/onboarding');
            return;
          }
          
          setTempData(profile);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    loadProfile();
  }, [
    authUser,
    authLoading,
    fetchUserProfile,
    hasValidProfile,
    profileError,
    clearError,
    profileLoading,
    router,
  ]);

  // Handler functions
  const handleImageUpload = async (file) => {
    setSuccess(null);
    try {
      const userId = authUser.uid;
      const imageUrl = await uploadProfileImage(userId, file);
      setSuccess("Profile image updated!");
      return imageUrl;
    } catch (err) {
      console.error("Failed to upload image:", err);
      throw err;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTempData(profileData);
  };

  const handleSave = async () => {
    setSuccess(null);
    try {
      const userId = authUser.uid;
      const updatedData = {
        ...tempData,
        email: authUser?.email || tempData.email,
      };

      const result = await updateProfile(userId, updatedData);
      setTempData(result);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleCancel = () => {
    setTempData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setTempData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Retry function for error state
  const handleRetry = async () => {
    if (!authUser) return;
    
    clearError();
    try {
      const userId = authUser.uid;
      await fetchUserProfile(userId, { force: true });
    } catch (err) {
      console.error("Retry failed:", err);
    }
  };

  // Loading and error states
  const isLoading = authLoading || profileLoading;
  
  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (profileError) {
    return <ErrorMessage message={profileError} onRetry={handleRetry} />;
  }

  if (!profileData) {
    return <LoadingSpinner message="Loading your profile..." showSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-600">
                  Manage your fitness journey
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar
              profileData={profileData}
              isEditing={isEditing}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onImageUpload={handleImageUpload}
              success={success}
              error={profileError}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <ProfileTabContent
              activeTab={activeTab}
              profileData={profileData}
              tempData={tempData}
              isEditing={isEditing}
              onInputChange={handleInputChange}
              authUser={authUser}
              success={success}
              error={profileError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}