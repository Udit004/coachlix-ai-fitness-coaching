import { Dumbbell, Trophy, Zap, Clock, TrendingUp, Activity } from "lucide-react";

export default function StatsTab({ profileData }) {
  // Stats from profileData
  const stats = profileData?.stats
    ? [
        {
          label: "Workouts Completed",
          value: profileData.stats.workoutsCompleted,
          icon: Dumbbell,
          color: "from-blue-500 to-blue-600",
        },
        {
          label: "Days Streak",
          value: profileData.stats.daysStreak,
          icon: Trophy,
          color: "from-green-500 to-green-600",
        },
        {
          label: "Calories Burned",
          value: profileData.stats.caloriesBurned,
          icon: Zap,
          color: "from-orange-500 to-orange-600",
        },
        {
          label: "Total Hours",
          value: profileData.stats.totalHours + "h",
          icon: Clock,
          color: "from-purple-500 to-purple-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Fitness Statistics
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-r ${stat.color} p-6 rounded-xl text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <IconComponent className="h-8 w-8" />
                <span className="text-2xl font-bold">
                  {stat.value}
                </span>
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
  );
}