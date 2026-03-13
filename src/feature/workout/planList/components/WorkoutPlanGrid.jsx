import { Plus, Dumbbell } from "lucide-react";
import WorkoutPlanCard from "./WorkoutPlanCard";

function EmptyState({ searchTerm, selectedGoal, selectedDifficulty, onCreateFirst }) {
  const isFiltered = searchTerm || selectedGoal || selectedDifficulty;
  return (
    <div className="text-center py-12">
      <div className="max-w-sm mx-auto">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No workout plans found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isFiltered
            ? "Try adjusting your search or filters"
            : "Create your first workout plan to get started"}
        </p>
        {!isFiltered && (
          <button
            onClick={onCreateFirst}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Plan</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function WorkoutPlanGrid({
  plans,
  searchTerm,
  selectedGoal,
  selectedDifficulty,
  onDelete,
  onClone,
  onEdit,
  onToggleActive,
  isDeleting,
  isCloning,
  onCreateFirst,
}) {
  if (plans.length === 0) {
    return (
      <EmptyState
        searchTerm={searchTerm}
        selectedGoal={selectedGoal}
        selectedDifficulty={selectedDifficulty}
        onCreateFirst={onCreateFirst}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        if (!plan || !plan._id) return null;
        return (
          <WorkoutPlanCard
            key={plan._id}
            plan={plan}
            onDelete={onDelete}
            onClone={onClone}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            isDeleting={isDeleting}
            isCloning={isCloning}
          />
        );
      })}
    </div>
  );
}
