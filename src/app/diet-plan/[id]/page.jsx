"use client";

import SingleDietPlanClient from "@/feature/diet/detailDietPage/pages/SingleDietPlanClient";
export default function SingleDietPlanPage({ params }) {
  return <SingleDietPlanClient planId={params.id} />;
}