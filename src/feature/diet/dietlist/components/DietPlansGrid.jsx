"use client";
import React from "react";
import DietPlanCard from "./DietPlanCard";
import { EmptyState } from "./DietPlanStates";

/**
 * DietPlansGrid — Display diet plan cards in a responsive grid
 */
export default function DietPlansGrid({
  plans,
  onDelete,
  onClone,
  onEdit,
  onToggleActive,
  isDeleting,
  isCloning,
  hasAnyFilters,
  onCreateClick,
}) {
  if (plans.length === 0) {
    return <EmptyState hasAnyFilters={hasAnyFilters} onCreateClick={onCreateClick} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        if (!plan?._id) return null;
        return (
          <DietPlanCard
            key={plan._id}
            plan={plan}
            onDelete={() => onDelete(plan._id)}
            onClone={onClone}
            onEdit={() => onEdit(plan)}
            onToggleActive={onToggleActive}
            isDeleting={isDeleting}
            isCloning={isCloning}
          />
        );
      })}
    </div>
  );
}
