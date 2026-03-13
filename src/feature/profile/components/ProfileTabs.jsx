import { User, BarChart3, Trophy, Activity, Settings } from "lucide-react";

export default function ProfileTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "stats", label: "Statistics", icon: BarChart3 },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "activity", label: "Recent Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/60 mb-6">
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-gray-100 dark:scrollbar-track-slate-900">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-slate-300 border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
