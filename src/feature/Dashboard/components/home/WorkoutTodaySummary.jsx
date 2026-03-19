import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkoutTodaySummary({ summary }) {
  if (!summary?.workout) {
    return (
      <div className="text-gray-600 dark:text-gray-300">
        Rest day or no workout scheduled for today.
      </div>
    );
  }

  const { week, workout, sessionLink } = summary;

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm text-gray-500">
          {week?.weeklyGoal || `Week ${week?.weekNumber || 1}`}
        </div>
        <h4 className="text-xl font-semibold">{workout.name}</h4>
      </div>

      <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
        {workout.exercises?.slice(0, 6).map((exercise, index) => (
          <li key={`${exercise.name}-${index}`}>
            <span className="font-medium">{exercise.name}</span>{" "}
            {exercise.targetSets ? `• ${exercise.targetSets} sets` : null}{" "}
            {exercise.targetReps ? `• ${exercise.targetReps} reps` : null}
          </li>
        ))}
        {workout.exercises?.length > 6 ? (
          <li>+{workout.exercises.length - 6} more…</li>
        ) : null}
      </ul>

      <div className="mt-4">
        <Button asChild className="cursor-pointer">
          <Link href={sessionLink}>Start Workout</Link>
        </Button>
      </div>
    </div>
  );
}
