"use client";

import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_KEYS } from "@/feature/Dashboard/hooks/dashboardQueryKeys";

async function fetchDashboardOverview() {
  const response = await fetch("/api/dashboard/overview", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard overview");
  }

  const payload = await response.json();
  return payload?.data || null;
}

export function useDashboardOverviewQuery() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overview(),
    queryFn: fetchDashboardOverview,
    staleTime: 2 * 60 * 1000,
  });
}
