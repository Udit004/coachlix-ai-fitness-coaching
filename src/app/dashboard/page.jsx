// SSR Server Component — rendered on each request (never statically cached)
export const dynamic = "force-dynamic";

import HomeDashboard from "@/feature/Dashboard/components/HomeDashboard";
import RecentActivitySection from "@/feature/Dashboard/components/RecentActivitySection";

/**
 * Dashboard page — SSR shell that renders client-side interactive widgets.
 * Authentication is enforced by AuthGuard in the root layout.
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <HomeDashboard />
      <RecentActivitySection />
    </div>
  );
}
