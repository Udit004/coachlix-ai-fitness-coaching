
"use client";
import { useAuthContext } from "@/auth/AuthContext";
import { useDietPlans } from "@/hooks/useDietPlanQueries";
import { useWorkoutPlans } from "@/hooks/useWorkoutQueries";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";

export default function ActivePlans() {
  const { user } = useAuthContext();
  const { data: dietPlans, isLoading: isLoadingDietPlans } = useDietPlans({ activeOnly: true });
  const { data: workoutPlans, isLoading: isLoadingWorkoutPlans } = useWorkoutPlans({ activeOnly: true });

  const isLoading = isLoadingDietPlans || isLoadingWorkoutPlans;

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeDietPlan = dietPlans?.[0];
  const activeWorkoutPlan = workoutPlans?.[0];

  if (!activeDietPlan && !activeWorkoutPlan) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Start Your Journey</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have any active plans yet. Create a new plan to get started!
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/diet-plan" passHref>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Diet Plan
            </Button>
          </Link>
          <Link href="/workout-plan" passHref>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Workout Plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {activeDietPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Active Diet Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold text-lg mb-2">{activeDietPlan.name}</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{activeDietPlan.description}</p>
            <Link href={`/diet-plan/${activeDietPlan._id}`} passHref>
              <Button>View Plan</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      {activeWorkoutPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Active Workout Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold text-lg mb-2">{activeWorkoutPlan.name}</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{activeWorkoutPlan.description}</p>
            <Link href={`/workout-plan/${activeWorkoutPlan._id}`} passHref>
              <Button>View Plan</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
