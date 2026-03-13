import { Dumbbell, Target, Clock, Trophy } from "lucide-react";

const COLOR_MAP = {
  blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
  purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
  orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
};

const STAT_CARDS = [
  { key: "totalPlans", label: "Total Plans", icon: Dumbbell, color: "blue" },
  { key: "activePlans", label: "Active Plans", icon: Target, color: "green" },
  { key: "averageDuration", label: "Avg Duration", icon: Clock, color: "purple", suffix: "w" },
  { key: "totalWorkouts", label: "Total Workouts", icon: Trophy, color: "orange" },
];

export default function WorkoutPlanStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:gap-4">
      {STAT_CARDS.map(({ key, label, icon: Icon, color, suffix = "" }) => (
        <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${COLOR_MAP[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5 truncate">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats[key]}{suffix}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
