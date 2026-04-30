const metadata = {
  title: "Workout Plan Detail",
  description: "Get detailed information about your selected workout plan, including exercises, sets, reps, and rest periods. Follow the plan to achieve your fitness goals effectively.",
};  

export { metadata };

import WorkoutPlanDetailClient from "@/feature/workout/detailPlan/pages/WorkoutPlanDetailClient";

export default function WorkoutPlanDetailPage() {
  return <WorkoutPlanDetailClient />;
}
