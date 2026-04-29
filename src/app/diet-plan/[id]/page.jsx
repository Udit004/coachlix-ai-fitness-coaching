"use client";

import { use } from "react";
import SingleDietPlanClient from "@/feature/diet/detailDietPage/pages/SingleDietPlanClient";
export default function SingleDietPlanPage({ params }) {
  const { id } = use(params);

  return <SingleDietPlanClient planId={id} />;
}