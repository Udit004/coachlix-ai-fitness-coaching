export default function ProgressTrackerTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <IconComponent className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
