import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WorkoutTodaySummary from "./WorkoutTodaySummary";

export default function TodayWorkoutCard({ workoutPlan, workoutSummary }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Today's Workout</CardTitle>
      </CardHeader>
      <CardContent>
        {!workoutPlan ? (
          <div className="text-gray-600 dark:text-gray-300">
            No active workout plan. Create one to get started.
            <div className="mt-4">
              <Link href="/workout-plan">
                <Button className="cursor-pointer">Create Workout Plan</Button>
              </Link>
            </div>
          </div>
        ) : (
          <WorkoutTodaySummary summary={workoutSummary} />
        )}
      </CardContent>
    </Card>
  );
}
