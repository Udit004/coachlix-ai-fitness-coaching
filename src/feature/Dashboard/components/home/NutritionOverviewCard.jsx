import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DietTodaySummary from "./DietTodaySummary";

function MacroCircle({ value, target, colorClass, label, suffix = "" }) {
  const safeTarget = target > 0 ? target : 1;
  const progress = Math.min(value / safeTarget, 1);
  const circumference = 2 * Math.PI * 20;

  return (
    <div className="text-center">
      <div className="relative w-12 h-12 mx-auto">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (1 - progress)}`}
            className={`${colorClass} transition-all duration-300`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="text-xs font-semibold mt-1">
        {value}
        {suffix}
      </div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

export default function NutritionOverviewCard({ dietPlan, nutrition }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Nutrition</CardTitle>
          {dietPlan ? (
            <Link href="/diet-plan">
              <Button variant="ghost" size="sm" className="h-8 text-xs cursor-pointer">
                View Plans
              </Button>
            </Link>
          ) : null}
        </div>
        {dietPlan ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dietPlan.name}</p>
        ) : null}
      </CardHeader>

      <CardContent className="pt-0">
        {!dietPlan ? (
          <div className="text-gray-600 dark:text-gray-300 text-sm">
            No active diet plan. Create one to track your nutrition.
            <div className="mt-3">
              <Link href="/diet-plan">
                <Button size="sm" className="cursor-pointer">
                  Create Diet Plan
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        {dietPlan && nutrition ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <MacroCircle
                value={nutrition.current.calories}
                target={nutrition.target.calories}
                colorClass="text-blue-500"
                label="Calories"
              />
              <MacroCircle
                value={nutrition.current.protein}
                target={nutrition.target.protein}
                colorClass="text-green-500"
                label="Protein"
                suffix="g"
              />
              <MacroCircle
                value={nutrition.current.carbs}
                target={nutrition.target.carbs}
                colorClass="text-orange-500"
                label="Carbs"
                suffix="g"
              />
              <MacroCircle
                value={nutrition.current.fats}
                target={nutrition.target.fats}
                colorClass="text-purple-500"
                label="Fats"
                suffix="g"
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Today's Meals</h4>
              <DietTodaySummary day={nutrition.day} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
