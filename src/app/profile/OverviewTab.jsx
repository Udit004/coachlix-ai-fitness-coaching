import { Mail, Phone, MapPin, Calendar, Target } from "lucide-react";

export default function OverviewTab({
  profileData,
  tempData,
  isEditing,
  onInputChange,
  authUser,
  success,
  error
}) {
  const data = isEditing ? tempData : profileData;

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Overview</h3>
      
      {/* Success/Error messages */}
      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={data.name || ""}
                onChange={(e) => onInputChange("name", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your full name"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {data.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              {authUser?.email || data.email}
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={data.phone || ""}
                onChange={(e) => onInputChange("phone", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your phone number"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                {data.phone}
              </p>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience
            </label>
            {isEditing ? (
              <select
                value={data.experience || ""}
                onChange={(e) => onInputChange("experience", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {data.experience}
              </p>
            )}
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height
            </label>
            {isEditing ? (
              <input
                type="text"
                value={data.height || ""}
                onChange={(e) => onInputChange("height", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your height (e.g. 170 cm)"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {data.height}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={data.location || ""}
                onChange={(e) => onInputChange("location", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your location"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                {data.location}
              </p>
            )}
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Birth Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={data.birthDate || ""}
                onChange={(e) => onInputChange("birthDate", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                {data.birthDate
                  ? new Date(data.birthDate).toLocaleDateString()
                  : ""}
              </p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight
            </label>
            {isEditing ? (
              <input
                type="text"
                value={data.weight || ""}
                onChange={(e) => onInputChange("weight", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your current weight (e.g. 70 kg)"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {data.weight}
              </p>
            )}
          </div>

          {/* Target Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Weight
            </label>
            {isEditing ? (
              <input
                type="text"
                value={data.targetWeight || ""}
                onChange={(e) => onInputChange("targetWeight", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your target weight (e.g. 65 kg)"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {data.targetWeight}
              </p>
            )}
          </div>

          {/* Fitness Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fitness Goal
            </label>
            {isEditing ? (
              <select
                value={data.fitnessGoal || ""}
                onChange={(e) => onInputChange("fitnessGoal", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Weight Loss & Muscle Gain">
                  Weight Loss & Muscle Gain
                </option>
                <option value="Maintain Weight">Maintain Weight</option>
                <option value="Athletic Performance">Athletic Performance</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                <Target className="h-4 w-4 mr-2 text-gray-500" />
                {data.fitnessGoal}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        {isEditing ? (
          <textarea
            value={data.bio || ""}
            onChange={(e) => onInputChange("bio", e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 resize-none"
            placeholder="Tell us about yourself and your fitness journey..."
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
            {data.bio}
          </p>
        )}
      </div>
    </div>
  );
}