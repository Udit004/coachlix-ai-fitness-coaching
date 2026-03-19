import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Calendar } from "lucide-react";

export default function QuickActionsCard({ workoutPlan, dietPlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button asChild className="w-full cursor-pointer" variant="default">
            <Link href="/ai-chat">
              <Bot className="w-4 h-4 mr-2" />
              Ask AI Coach
            </Link>
          </Button>

          {workoutPlan ? (
            <Button asChild className="w-full cursor-pointer" variant="outline">
              <Link href={`/workout-plan/${workoutPlan._id}`}>
                <Calendar className="w-4 h-4 mr-2" />
                View Workout Plan
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full cursor-pointer" variant="outline">
              <Link href="/workout-plan">Create Workout Plan</Link>
            </Button>
          )}

          {dietPlan ? (
            <Button asChild className="w-full cursor-pointer" variant="outline">
              <Link href={`/diet-plan/${dietPlan._id}`}>Add Meal</Link>
            </Button>
          ) : (
            <Button asChild className="w-full cursor-pointer" variant="outline">
              <Link href="/diet-plan">Create Diet Plan</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
