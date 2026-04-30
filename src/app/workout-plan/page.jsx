
const metadata = {
  title: "Workout Plans",
  description: "Discover our customized workout plans to reach your fitness objectives. From beginner-friendly routines to advanced training regimens, we have the perfect exercises to suit your needs.",
};

export { metadata };
import WorkoutPlanListClient from "@/feature/workout/planList/pages/WorkoutPlanListClient";

export default function WorkoutPlansPage() {
  return <WorkoutPlanListClient />;
}
