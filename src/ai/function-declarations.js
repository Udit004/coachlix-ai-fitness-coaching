// src/ai/function-declarations.js
// Gemini function declarations for tool calling

/**
 * Convert our tool registry to Gemini's function declaration format
 * This tells Gemini what functions it can call and when to pause
 * 
 * Gemini function declaration format:
 * {
 *   name: "tool_name",
 *   description: "What this tool does",
 *   parameters: {
 *     type: "object",
 *     properties: {
 *       param1: { type: "string", description: "..." },
 *       param2: { type: "number", description: "..." }
 *     },
 *     required: ["param1"]
 *   }
 * }
 */
export function getGeminiFunctionDeclarations() {
  return [
    {
      name: "fetch_details",
      description: "Fetch detailed meal or workout information when user asks for specifics like 'what should I eat today' or 'what exercises today'. Use this when the user needs detailed breakdown of meals or exercises, not just summaries.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID (required)"
          },
          type: {
            type: "string",
            description: "Type of details to fetch: 'diet' or 'workout'",
            enum: ["diet", "workout"]
          },
          detail: {
            type: "string",
            description: "Detail level: 'today' (current day), 'full' (all days up to 7), 'specific_day' (requires dayNumber)",
            enum: ["today", "full", "specific_day"]
          },
          dayNumber: {
            type: "number",
            description: "Specific day number (1-7) when detail='specific_day'"
          }
        },
        required: ["userId", "type", "detail"]
      }
    },
    {
      name: "nutrition_lookup",
      description: "Look up detailed nutrition information for specific foods. Use when user asks 'how many calories in X' or 'nutrition facts for X'.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID (required)"
          },
          foodName: {
            type: "string",
            description: "Name of the food to look up"
          }
        },
        required: ["userId", "foodName"]
      }
    },
    {
      name: "calculate_health_metrics",
      description: "Calculate BMI, BMR, TDEE, or calorie needs. Use when user asks to 'calculate my BMI' or 'how many calories should I eat'.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID (required)"
          },
          action: {
            type: "string",
            description: "Action to perform: 'calculate' (calculate all metrics) or 'get' (retrieve existing)",
            enum: ["calculate", "get"]
          }
        },
        required: ["userId"]
      }
    },
    {
      name: "create_diet_plan",
      description: "Create a new personalized diet plan. Use when user says 'create a diet plan' or 'I need a meal plan'.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID (required)"
          },
          planName: {
            type: "string",
            description: "Name for the diet plan (e.g., 'Weight Loss Plan')"
          },
          goal: {
            type: "string",
            description: "Goal: 'weight_loss', 'muscle_gain', 'maintenance', 'cutting', or 'bulking'"
          },
          targetCalories: {
            type: "number",
            description: "Target daily calories (optional, will calculate if not provided)"
          },
          duration: {
            type: "number",
            description: "Duration in days (default: 7)"
          },
          dietaryRestrictions: {
            type: "array",
            items: { type: "string" },
            description: "Dietary restrictions like 'vegetarian', 'vegan', 'gluten-free'"
          }
        },
        required: ["userId", "goal"]
      }
    },
    {
      name: "update_diet_plan",
      description: "Update or modify an existing diet plan. Use when user wants to 'change my diet plan' or 'update my meals'.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID (required)"
          },
          planId: {
            type: "string",
            description: "Plan ID or name to update"
          },
          action: {
            type: "string",
            description: "Action: 'update' (modify plan)",
            enum: ["update"]
          }
        },
        required: ["userId", "action"]
      }
    },
    {
      name: "update_workout_plan",
      description: "Create or update workout plans. Use when user wants to 'create a workout plan' or 'update my exercises'.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID (required)"
          },
          planName: {
            type: "string",
            description: "Name for the workout plan"
          },
          action: {
            type: "string",
            description: "Action: 'create' (new plan), 'update' (modify existing), or 'get' (retrieve existing)",
            enum: ["create", "update", "get"]
          },
          exercises: {
            type: "array",
            items: { type: "object" },
            description: "Array of exercise objects (for create/update)"
          },
          duration: {
            type: "number",
            description: "Duration in weeks"
          },
          difficulty: {
            type: "string",
            description: "Difficulty level: 'beginner', 'intermediate', or 'advanced'"
          },
          goal: {
            type: "string",
            description: "Workout goal: 'strength', 'endurance', 'flexibility', 'weight_loss', or 'muscle_gain'"
          }
        },
        required: ["userId"]
      }
    }
  ];
}
