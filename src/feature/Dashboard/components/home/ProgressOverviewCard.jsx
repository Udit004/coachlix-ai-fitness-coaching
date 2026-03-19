import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import PersonalRecordsWidget from "@/feature/home/PersonalRecordsWidget";
import WeeklyCalendarView from "@/feature/home/WeeklyCalendarView";

export default function ProgressOverviewCard({ workoutStats, planStats, weekDays, currentDayNumber }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Workouts</div>
            <div className="text-xl font-semibold">
              {workoutStats?.totalWorkouts ?? planStats?.totalWorkouts ?? 0}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Avg mins</div>
            <div className="text-xl font-semibold">
              {workoutStats?.averageWorkoutDuration ?? planStats?.averageWorkoutDuration ?? 0}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Completion</div>
            <div className="text-xl font-semibold">
              {(workoutStats?.completionRate ?? planStats?.completionRate ?? 0)}%
            </div>
          </div>
        </div>

        <PersonalRecordsWidget records={planStats?.strongestLifts || []} limit={3} />

        <WeeklyCalendarView weekDays={weekDays || []} currentDayNumber={currentDayNumber} />
      </CardContent>
    </Card>
  );
}
