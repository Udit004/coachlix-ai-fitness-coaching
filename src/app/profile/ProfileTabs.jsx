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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 mb-6">
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
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