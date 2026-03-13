import { useState, useRef } from "react";
import { Camera, Edit3, Save, X, MapPin } from "lucide-react";

export default function ProfileSidebar({
  profileData,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onImageUpload,
  success,
  error,
}) {
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imageUrl = await onImageUpload(file);
      setProfileImage(imageUrl);
    } catch (err) {
      console.error("Failed to upload image:", err);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/60 p-6">
      <div className="relative flex flex-col items-center mb-6">
        <div className="relative group">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
            {profileImage || profileData?.profileImage ? (
              <img
                src={profileImage || profileData.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              profileData.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group-hover:scale-110 transform duration-200"
          >
            <Camera className="h-4 w-4 text-gray-600 dark:text-slate-300" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-4 text-center">{profileData.name}</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300 text-center">{profileData.fitnessGoal}</p>
        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-slate-400">
          <MapPin className="h-3 w-3 mr-1" />
          {profileData.location}
        </div>
      </div>

      {success && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg mb-4 text-sm">{success}</div>}
      {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Experience</span>
          <span className="text-sm font-bold text-blue-600">{profileData.experience}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Current Weight</span>
          <span className="text-sm font-bold text-green-600">{profileData.weight}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Target Weight</span>
          <span className="text-sm font-bold text-purple-600">{profileData.targetWeight}</span>
        </div>
      </div>

      <div className="space-y-2">
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center cursor-pointer"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onSave}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-gray-500 dark:bg-slate-700 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 dark:hover:bg-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
