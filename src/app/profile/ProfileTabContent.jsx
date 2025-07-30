import OverviewTab from "./tabs/OverviewTab";
import StatsTab from "./tabs/StatsTab";
import AchievementsTab from "./tabs/AchievementsTab";
import ActivityTab from "./tabs/ActivityTab";
import SettingsTab from "./tabs/SettingsTab";

export default function ProfileTabContent({
  activeTab,
  profileData,
  tempData,
  isEditing,
  onInputChange,
  authUser,
  success,
  error
}) {
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            profileData={profileData}
            tempData={tempData}
            isEditing={isEditing}
            onInputChange={onInputChange}
            authUser={authUser}
            success={success}
            error={error}
          />
        );
      case "stats":
        return <StatsTab profileData={profileData} />;
      case "achievements":
        return <AchievementsTab profileData={profileData} />;
      case "activity":
        return <ActivityTab profileData={profileData} />;
      case "settings":
        return <SettingsTab />;
      default:
        return <OverviewTab profileData={profileData} />;
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
      {renderTabContent()}
    </div>
  );
}