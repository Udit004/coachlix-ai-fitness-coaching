// src/ai/tools/index.js
// filepath: src/ai/tools/index.js
import { NutritionLookupTool } from './nutritionTool';
import { UpdateWorkoutPlanTool, GetWorkoutPlanTool } from './workoutTool';
import { CreateDietPlanTool, UpdateDietPlanTool } from './dietPlanTool';
import { HealthMetricsTool } from './healthMetricsTool';

export function getFitnessTools() {
  return [
    new NutritionLookupTool(),
    new UpdateWorkoutPlanTool(),
    new GetWorkoutPlanTool(),
    new HealthMetricsTool(),
    new CreateDietPlanTool(),
    new UpdateDietPlanTool(),
  ];
}

export {
  NutritionLookupTool,
  UpdateWorkoutPlanTool,
  GetWorkoutPlanTool,
  CreateDietPlanTool,
  UpdateDietPlanTool,
  HealthMetricsTool,
};