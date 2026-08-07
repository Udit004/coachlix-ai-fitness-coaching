"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HomeDashboard from "@/feature/Dashboard/components/HomeDashboard";
import RecentActivitySection from "@/feature/Dashboard/components/RecentActivitySection";

export default function DashboardClientPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/ai-chat");
  }, []);

  return (
    <>
      <HomeDashboard />
      <RecentActivitySection />
    </>
  );
}
