// src/ai/tools/index.js
// REFACTORED: Simple function exports for direct tool calling (no LangChain agent scaffolding)
// Tools vs Dynamic RAG Context:
// - Tools are for ACTIONS: creating, updating, modifying data
// - Context Retrieval (RAG) is for READING: user's existing plans, profile, progress

import { NutritionLookupTool } from './nutritionTool';
import { UpdateWorkoutPlanTool } from './workoutTool';
import { CreateDietPlanTool, UpdateDietPlanTool } from './dietPlanTool';
import { HealthMetricsTool } from './healthMetricsTool';
import { FetchDetailsTool } from './fetchDetailsTool';

// Instantiate tool classes once (for backward compatibility with LangChain if needed)
const nutritionTool = new NutritionLookupTool();
const workoutTool = new UpdateWorkoutPlanTool();
const healthTool = new HealthMetricsTool();
const createDietTool = new CreateDietPlanTool();
const updateDietTool = new UpdateDietPlanTool();
const fetchDetailsTool = new FetchDetailsTool();

/**
 * Simple async function wrappers for direct tool calling
 * These can be called directly without LangChain agent scaffolding
 */

/**
 * Look up nutrition information for a food item
 * @param {string} foodName - Name of the food to look up
 * @param {string} userId - User ID for personalization
 * @returns {Promise<string>} Nutrition information
 */
export async function nutritionLookup({ foodName, userId }) {
  return await nutritionTool._call(JSON.stringify({ foodName, userId }));
}

/**
 * Create or update a workout plan
 * @param {Object} params - Workout plan parameters
 * @param {string} params.userId - User ID (required)
 * @param {string} params.planName - Name of the workout plan
 * @param {Array} params.exercises - Array of exercises
 * @param {number} params.duration - Duration in weeks
 * @param {string} params.difficulty - Difficulty level
 * @param {string} params.goal - Fitness goal
 * @param {string} params.action - Action to perform (get, create, update)
 * @returns {Promise<string>} Workout plan result
 */
export async function updateWorkoutPlan(params) {
  return await workoutTool._call(JSON.stringify(params));
}

/**
 * Calculate health metrics (BMI, BMR, calorie needs)
 * @param {Object} params - Health metric parameters
 * @param {string} params.userId - User ID (required)
 * @param {string} params.action - Action to perform (calculate, get)
 * @returns {Promise<string>} Health metrics result
 */
export async function calculateHealthMetrics(params) {
  return await healthTool._call(JSON.stringify(params));
}

/**
 * Create a new diet plan
 * @param {Object} params - Diet plan parameters
 * @param {string} params.userId - User ID (required)
 * @param {string} params.planName - Name of the diet plan
 * @param {string} params.goal - Fitness goal
 * @param {number} params.targetCalories - Target daily calories
 * @param {number} params.duration - Duration in days
 * @param {Array} params.dietaryRestrictions - Dietary restrictions
 * @returns {Promise<string>} Diet plan creation result
 */
export async function createDietPlan(params) {
  return await createDietTool._call(JSON.stringify(params));
}

/**
 * Update an existing diet plan
 * @param {Object} params - Diet plan update parameters
 * @param {string} params.userId - User ID (required)
 * @param {string} params.planId - Plan ID or planName (required)
 * @param {string} params.action - Action to perform (get, update)
 * @returns {Promise<string>} Diet plan update result
 */
export async function updateDietPlan(params) {
  return await updateDietTool._call(JSON.stringify(params));
}

/**
 * Fetch detailed diet or workout information
 * @param {Object} params - Detail fetch parameters
 * @param {string} params.userId - User ID (required)
 * @param {string} params.type - Type of detail ('diet' or 'workout')
 * @param {string} params.detail - Detail level ('today', 'full', 'specific_day')
 * @param {number} params.dayNumber - Specific day number (optional)
 * @returns {Promise<string>} Detailed information
 */
export async function fetchDetails(params) {
  return await fetchDetailsTool._call(JSON.stringify(params));
}

/**
 * Tool registry for dynamic tool calling
 * Maps tool names to their corresponding functions
 */
export const toolRegistry = {
  'nutrition_lookup': nutritionLookup,
  'update_workout_plan': updateWorkoutPlan,
  'calculate_health_metrics': calculateHealthMetrics,
  'create_diet_plan': createDietPlan,
  'update_diet_plan': updateDietPlan,
  'fetch_details': fetchDetails,
};

/**
 * Get tool function by name
 * @param {string} toolName - Name of the tool
 * @returns {Function|null} Tool function or null if not found
 */
export function getToolByName(toolName) {
  return toolRegistry[toolName] || null;
}

/**
 * Get available tool names for LLM prompt
 * @returns {string[]} Array of available tool names
 */
export function getAvailableToolNames() {
  return Object.keys(toolRegistry);
}

/**
 * Get tool descriptions for LLM prompt
 * @returns {string} Formatted tool descriptions
 */
export function getToolDescriptions() {
  return `Available tools:
1. nutrition_lookup - Look up nutrition information for foods
   Required args: { foodName: string, userId: string }

2. update_workout_plan - Create or update workout plans
   Required args: { userId: string, planName?: string, action?: "get"|"create"|"update", exercises?: Array, duration?: number, difficulty?: string, goal?: string }

3. calculate_health_metrics - Calculate BMI, BMR, calorie needs
   Required args: { userId: string, action?: "calculate"|"get" }

4. create_diet_plan - Create new personalized diet plans
   Required args: { userId: string, planName?: string, goal?: string, targetCalories?: number, duration?: number, dietaryRestrictions?: Array }

5. update_diet_plan - Update existing diet plans (NOT for viewing - use fetch_details instead)
   Required args: { userId: string, planId?: string, planName?: string, action: "update" }

6. fetch_details - Fetch detailed meal or workout information when user needs specifics
   Required args: { userId: string, type: "diet"|"workout", detail?: "today"|"full"|"specific_day", dayNumber?: number }
   Use this when user asks: "What should I eat today?", "Show me my full diet plan", "What exercises today?"`;
}

/**
 * Legacy: Get all available fitness tools for LangChain agent (backward compatibility)
 * @deprecated Use direct function calls instead
 */
export function getFitnessTools() {
  return [
    nutritionTool,
    workoutTool,
    healthTool,
    createDietTool,
    updateDietTool,
    fetchDetailsTool,
  ];
}

// Legacy exports for backward compatibility
export {
  NutritionLookupTool,
  UpdateWorkoutPlanTool,
  CreateDietPlanTool,
  UpdateDietPlanTool,
  HealthMetricsTool,
  FetchDetailsTool,
};