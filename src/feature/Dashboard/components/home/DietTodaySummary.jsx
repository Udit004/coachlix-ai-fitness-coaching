const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export default function DietTodaySummary({ day }) {
  if (!day) {
    return (
      <div className="text-gray-600 dark:text-gray-300 text-sm">
        No meals scheduled for today.
      </div>
    );
  }

  const meals = [...(day.meals || [])].sort(
    (a, b) => MEAL_ORDER.indexOf(a.type) - MEAL_ORDER.indexOf(b.type)
  );

  return (
    <div className="space-y-2">
      {MEAL_ORDER.slice(0, 3).map((type) => {
        const meal = meals.find((item) => item.type === type);
        if (!meal?.items?.length) {
          return null;
        }

        return (
          <div
            key={type}
            className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {type}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {meal.items
                  .slice(0, 2)
                  .map((item) => item.name)
                  .join(", ")}
                {meal.items.length > 2 ? ` +${meal.items.length - 2} more` : ""}
              </div>
            </div>
            <div className="text-xs text-gray-500 ml-2">{meal.totalCalories || 0} cal</div>
          </div>
        );
      })}
    </div>
  );
}
