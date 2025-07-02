'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '../../auth/AuthContext';
import { 
  User, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Target,
  Activity,
  Trophy,
  Heart,
  Zap,
  Clock,
  TrendingUp,
  Settings,
  Bell,
  Shield,
  LogOut,
  Upload,
  Check,
  Star,
  Dumbbell,
  Apple,
  Timer,
  Award,
  BarChart3,
  Users,
  BookOpen,
  Plus
} from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [tempData, setTempData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        let token = null;
        if (authUser) {
          token = await authUser.getIdToken();
        }
        const res = await fetch('/api/userProfile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setProfileData(data.data);
          setTempData(data.data);
        } else {
          setError(data.error || 'Failed to load profile');
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) {
      fetchProfile();
    }
  }, [authUser, authLoading]);

  // Stats, achievements, and activities from profileData
  const stats = profileData?.stats ? [
    { label: 'Workouts Completed', value: profileData.stats.workoutsCompleted, icon: Dumbbell, color: 'from-blue-500 to-blue-600' },
    { label: 'Days Streak', value: profileData.stats.daysStreak, icon: Trophy, color: 'from-green-500 to-green-600' },
    { label: 'Calories Burned', value: profileData.stats.caloriesBurned, icon: Zap, color: 'from-orange-500 to-orange-600' },
    { label: 'Total Hours', value: profileData.stats.totalHours + 'h', icon: Clock, color: 'from-purple-500 to-purple-600' }
  ] : [];

  const achievements = profileData?.achievements || [];
  const recentActivities = profileData?.recentActivities || [];

  // Upload image to backend and update profile image
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      let token = null;
      if (authUser) {
        token = await authUser.getIdToken();
      }
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/userProfile/image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setProfileImage(data.imageUrl);
        setProfileData((prev) => ({ ...prev, profileImage: data.imageUrl }));
        setSuccess('Profile image updated!');
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTempData(profileData);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      let token = null;
      if (authUser) {
        token = await authUser.getIdToken();
      }
      // Always use the logged-in user's email for update
      const updatedData = {
        ...tempData,
        email: authUser?.email || tempData.email,
      };
      const res = await fetch('/api/userProfile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.success) {
        setProfileData({ ...profileData, ...data.data });
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setTempData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'activity', label: 'Recent Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
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
                <p className="text-sm text-gray-600">Manage your fitness journey</p>
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
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              {/* Profile Image */}
              <div className="relative flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                    {profileImage || profileData?.profileImage ? (
                      <img src={profileImage || profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      profileData.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-2 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors group-hover:scale-110 transform duration-200"
                  >
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-4 text-center">{profileData.name}</h2>
                <p className="text-sm text-gray-600 text-center">{profileData.fitnessGoal}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profileData.location}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Experience</span>
                  <span className="text-sm font-bold text-blue-600">{profileData.experience}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Current Weight</span>
                  <span className="text-sm font-bold text-green-600">{profileData.weight}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Target Weight</span>
                  <span className="text-sm font-bold text-purple-600">{profileData.targetWeight}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!isEditing ? (
                  <button 
                    onClick={handleEdit}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={handleSave}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="w-full bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 mb-6">
              <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                          : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              {activeTab === 'overview' && profileData && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Overview</h3>
                  {/* Success/Error messages */}
                  {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}
                  {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{profileData.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {authUser?.email || profileData.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={tempData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            placeholder="Enter your phone number"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            {profileData.phone}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                        {isEditing ? (
                          <select
                            value={tempData.experience || ''}
                            onChange={(e) => handleInputChange('experience', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{profileData.experience}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempData.height || ''}
                            onChange={(e) => handleInputChange('height', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            placeholder="Enter your height (e.g. 170 cm)"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{profileData.height}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempData.location || ''}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            placeholder="Enter your location"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            {profileData.location}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={tempData.birthDate || ''}
                            onChange={(e) => handleInputChange('birthDate', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {profileData.birthDate ? new Date(profileData.birthDate).toLocaleDateString() : ''}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempData.weight || ''}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            placeholder="Enter your current weight (e.g. 70 kg)"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{profileData.weight}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Weight</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempData.targetWeight || ''}
                            onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            placeholder="Enter your target weight (e.g. 65 kg)"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{profileData.targetWeight}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Goal</label>
                        {isEditing ? (
                          <select
                            value={tempData.fitnessGoal || ''}
                            onChange={(e) => handleInputChange('fitnessGoal', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          >
                            <option value="Weight Loss">Weight Loss</option>
                            <option value="Muscle Gain">Muscle Gain</option>
                            <option value="Weight Loss & Muscle Gain">Weight Loss & Muscle Gain</option>
                            <option value="Maintain Weight">Maintain Weight</option>
                            <option value="Athletic Performance">Athletic Performance</option>
                          </select>
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                            <Target className="h-4 w-4 mr-2 text-gray-500" />
                            {profileData.fitnessGoal}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    {isEditing ? (
                      <textarea
                        value={tempData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 resize-none"
                        placeholder="Tell us about yourself and your fitness journey..."
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{profileData.bio}</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Fitness Statistics</h3>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => {
                      const IconComponent = stat.icon;
                      return (
                        <div key={index} className={`bg-gradient-to-r ${stat.color} p-6 rounded-xl text-white shadow-lg`}>
                          <div className="flex items-center justify-between mb-2">
                            <IconComponent className="h-8 w-8" />
                            <span className="text-2xl font-bold">{stat.value}</span>
                          </div>
                          <p className="text-sm opacity-90">{stat.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Progress Charts Placeholder */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        Weight Progress
                      </h4>
                      <div className="h-48 bg-white rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Chart would go here</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-green-600" />
                        Weekly Activity
                      </h4>
                      <div className="h-48 bg-white rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Chart would go here</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => {
                      const IconComponent = achievement.icon;
                      return (
                        <div 
                          key={index} 
                          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            achievement.earned 
                              ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-md' 
                              : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-xl ${
                              achievement.earned 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                                : 'bg-gray-300 text-gray-500'
                            }`}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              {achievement.earned && (
                                <div className="flex items-center mt-2 text-green-600">
                                  <Check className="h-4 w-4 mr-1" />
                                  <span className="text-sm font-medium">Earned</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                  
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'workout' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'diet' ? 'bg-green-100 text-green-600' :
                          activity.type === 'goal' ? 'bg-purple-100 text-purple-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {activity.type === 'workout' && <Dumbbell className="h-5 w-5" />}
                          {activity.type === 'diet' && <Apple className="h-5 w-5" />}
                          {activity.type === 'goal' && <Target className="h-5 w-5" />}
                          {activity.type === 'achievement' && <Trophy className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-gray-600">{activity.description}</p>
                          )}
                          {activity.duration && (
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Timer className="h-4 w-4 mr-1" />
                              {activity.duration}
                              {activity.calories && (
                                <>
                                  <span className="mx-2">•</span>
                                  <Zap className="h-4 w-4 mr-1" />
                                  {activity.calories} cal
                                </>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bell className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Notifications</h4>
                            <p className="text-sm text-gray-600">Manage your notification preferences</p>
                          </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Configure
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Privacy & Security</h4>
                            <p className="text-sm text-gray-600">Control your privacy settings</p>
                          </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Manage
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <LogOut className="h-5 w-5 text-red-600" />
                          <div>
                            <h4 className="font-medium text-red-900">Sign Out</h4>
                            <p className="text-sm text-red-600">Sign out of your account</p>
                          </div>
                        </div>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}