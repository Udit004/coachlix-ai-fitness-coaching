import { Check, Trophy } from "lucide-react";

export default function AchievementsTab({ profileData }) {
  const achievements = profileData?.achievements || [];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Achievements</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement, index) => {
          const IconComponent = achievement.icon;
          return (
            <div
              key={index}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                achievement.earned
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700/60 shadow-md"
                  : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-60"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-xl ${
                    achievement.earned
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                      : "bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                  }`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-300">{achievement.description}</p>
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

      {achievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-slate-500 mb-4">
            <Trophy className="h-16 w-16 mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No Achievements Yet</h4>
          <p className="text-gray-600 dark:text-slate-300">Complete workouts and reach your goals to earn achievements!</p>
        </div>
      )}
    </div>
  );
}
