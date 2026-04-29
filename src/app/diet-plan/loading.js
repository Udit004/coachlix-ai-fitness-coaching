import RouteTransitionShell from "@/components/RouteTransitionShell";

export default function DietPlanLoading() {
  return (
    <RouteTransitionShell
      title="Diet Plans"
      subtitle="Loading nutrition plans and meal details..."
      cardCount={6}
    />
  );
}