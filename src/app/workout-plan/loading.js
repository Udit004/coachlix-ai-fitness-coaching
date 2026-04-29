import RouteTransitionShell from "@/components/RouteTransitionShell";

export default function WorkoutPlanLoading() {
  return (
    <RouteTransitionShell
      title="Workout Plans"
      subtitle="Loading training plans and workout progress..."
      cardCount={6}
    />
  );
}