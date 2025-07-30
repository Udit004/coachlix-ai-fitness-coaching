import { Bell, Shield, LogOut } from "lucide-react";

export default function SettingsTab() {
  const handleSignOut = () => {
    // Implement sign out logic here
    console.log("Signing out...");
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Settings</h3>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Notifications</h4>
                <p className="text-sm text-gray-600">
                  Manage your notification preferences
                </p>
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
                <p className="text-sm text-gray-600">
                  Control your privacy settings
                </p>
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
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}