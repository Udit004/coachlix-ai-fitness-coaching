"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Bell, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useUserProfile,
  useUpdateUserProfile,
  useUploadProfileImage,
} from "@/feature/profile/hooks/useProfileQueries";
import ProfileSidebar from "../components/ProfileSidebar";
import ProfileTabs from "../components/ProfileTabs";
import ProfileTabContent from "../components/ProfileTabContent";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function ProfilePageClient() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tempData, setTempData] = useState(null);
  const tabContentScrollRef = useRef(null);

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useUserProfile();

  const updateProfileMutation = useUpdateUserProfile();
  const uploadProfileImageMutation = useUploadProfileImage();

  const [success, setSuccess] = useState(null);

  useEffect(() => {
    tabContentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    if (authLoading || !authUser || !profileData) return;
    if (profileData.needsOnboarding) {
      router.push("/onboarding");
      return;
    }

    if (!isEditing) {
      setTempData(profileData);
    }
  }, [authLoading, authUser, profileData, router, isEditing]);

  const handleImageUpload = async (file) => {
    setSuccess(null);
    try {
      const imageUrl = await uploadProfileImageMutation.mutateAsync(file);
      setTempData((prev) => (prev ? { ...prev, profileImage: imageUrl } : prev));
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
      const updatedData = {
        ...tempData,
        email: authUser?.email || tempData.email,
      };

      const result = await updateProfileMutation.mutateAsync(updatedData);
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

  const handleRetry = async () => {
    await refetch();
  };

  const isLoading = authLoading || profileLoading;
  if (isLoading) return <LoadingSpinner message="Loading profile..." />;
  if (profileError) return <ErrorMessage message={profileError.message} onRetry={handleRetry} />;
  if (!profileData) return <LoadingSpinner message="Loading your profile..." showSpinner />;

  const viewError =
    updateProfileMutation.error?.message ||
    uploadProfileImageMutation.error?.message ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Profile</h1>
                <p className="text-sm text-gray-600 dark:text-slate-300">Manage your fitness journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ProfileSidebar
              profileData={profileData}
              isEditing={isEditing}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onImageUpload={handleImageUpload}
              success={success}
              error={viewError}
            />
          </div>

          <div className="lg:col-span-3 flex flex-col lg:max-h-[calc(100vh-10rem)]">
            <div className="shrink-0">
              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div ref={tabContentScrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
              <ProfileTabContent
                activeTab={activeTab}
                profileData={profileData}
                tempData={tempData}
                isEditing={isEditing}
                onInputChange={handleInputChange}
                authUser={authUser}
                success={success}
                error={viewError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
