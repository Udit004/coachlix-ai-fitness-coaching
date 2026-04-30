
const metadata = {
  title: "Dashboard",
  description: "Welcome to your personalized fitness dashboard. Track your progress, view your workout plans, and manage your diet with ease.",
};

export { metadata };

import DashboardClientPage from "@/feature/Dashboard/pages/DashboardClientPage";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <DashboardClientPage />
    </div>
  );
}
