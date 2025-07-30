import { Dumbbell, Apple, Target, Trophy, Timer, Zap, Activity } from "lucide-react";

export default function ActivityTab({ profileData }) {
  const recentActivities = profileData?.recentActivities || [];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>

      <div className="space-y-4">
        {recentActivities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl"
          >
            <div
              className={`p-2 rounded-lg ${
                activity.type === "workout"
                  ? "bg-blue-100 text-blue-600"
                  : activity.type === "diet"
                  ? "bg-green-100 text-green-600"
                  : activity.type === "goal"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {activity.type === "workout" && <Dumbbell className="h-5 w-5" />}
              {activity.type === "diet" && <Apple className="h-5 w-5" />}
              {activity.type === "goal" && <Target className="h-5 w-5" />}
              {activity.type === "achievement" && <Trophy className="h-5 w-5" />}
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

      {recentActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Activity className="h-16 w-16 mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Recent Activity
          </h4>
          <p className="text-gray-600">
            Your recent workouts and activities will appear here.
          </p>
        </div>
      )}
    </div>
  );
}