// src/ai/tools/workoutTool.js
import { Tool } from "@langchain/core/tools";
import { connectDB } from "../../lib/db";
import User from "../../models/userProfileModel";
import WorkoutPlan from "../../models/WorkoutPlan";

/**
 * Enhanced tool for updating workout plans with context awareness
 */
export class UpdateWorkoutPlanTool extends Tool {
  name = "update_workout_plan";
  description =
    "Create or modify workout plans. Input: JSON with userId, action, planName, exercises. Returns workout plan details.";

  async _call(planInput) {
    try {
      const planData = JSON.parse(planInput);
      const {
        userId,
        planName,
        exercises,
        duration,
        difficulty,
        notes,
        goal,
        action,
      } = planData;

      if (!userId) {
        return "Error: userId is required to update workout plan.";
      }

      await connectDB();

      // If action is 'get' or 'retrieve', return existing plans
      if (action === "get" || action === "retrieve") {
        const existingPlans = await WorkoutPlan.find({ userId, isActive: true })
          .select("name goal difficulty currentWeek stats")
          .limit(5)
          .lean();

        if (existingPlans.length === 0) {
          return "No active workout plans found for this user.";
        }

        let plansList = "Your Current Workout Plans:\n";
        existingPlans.forEach((plan, index) => {
          plansList += `\n${index + 1}. ${plan.name}`;
          plansList += `\n   Goal: ${plan.goal}`;
          plansList += `\n   Difficulty: ${plan.difficulty}`;
          plansList += `\n   Progress: Week ${plan.currentWeek} | ${
            plan.stats?.completionRate || 0
          }% complete`;
          plansList += `\n   Workouts Done: ${
            plan.stats?.totalWorkouts || 0
          }\n`;
        });

        return plansList;
      }

      // Create or update workout plan
      if (!planName) {
        return "Error: planName is required to create/update workout plan.";
      }

      // Get user context for better plan creation
      const user = await User.findOne({ firebaseUid: userId }).lean();
      const userGoal = goal || user?.fitnessGoal || "General Fitness";
      const userExperience = difficulty || user?.experience || "Beginner";

      // Create workout plan structure
      const workoutPlan = await WorkoutPlan.findOneAndUpdate(
        { userId, name: planName },
        {
          name: planName,
          description: notes || `Personalized ${userGoal} workout plan`,
          goal: userGoal,
          difficulty: userExperience,
          duration: duration || 4, // weeks
          workoutFrequency: 3, // default 3x per week
          weeks: exercises
            ? formatExercisesToWeeks(exercises, userExperience)
            : [],
          targetMuscleGroups: extractTargetMuscles(exercises),
          equipment: extractEquipment(exercises),
          isActive: true,
          createdBy: "ai",
          currentWeek: 1,
          startDate: new Date(),
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      // Update user stats
      if (user) {
        await User.findOneAndUpdate(
          { firebaseUid: userId },
          {
            $addToSet: {
              recentActivities: {
                type: "workout",
                title: `Created workout plan: ${planName}`,
                description: `New ${userGoal} plan with ${userExperience} difficulty`,
                date: new Date(),
              },
            },
          }
        );
      }

      return `Successfully created/updated workout plan "${planName}"!\n\nPlan Details:\n• Goal: ${userGoal}\n• Difficulty: ${userExperience}\n• Duration: ${
        duration || 4
      } weeks\n• Frequency: 3x per week\n\nYour plan includes ${
        exercises?.length || "various"
      } exercises tailored to your experience level. Ready to start your fitness journey!`;
    } catch (error) {
      console.error("Error updating workout plan:", error);
      return `Error updating workout plan: ${error.message}`;
    }
  }
}

/**
 * Tool specifically for retrieving workout plan details and schedules
 */
export class GetWorkoutPlanTool extends Tool {
  name = "get_workout_plan";
  description =
    "Get user workout plans and schedules. Input: JSON with userId. Returns current workouts, exercises, progress.";

  async _call(input) {
    try {
      console.log("🔍 GetWorkoutPlanTool called with input:", input);
      
      const data = JSON.parse(input);
      const { userId } = data;

      if (!userId) {
        console.error("❌ GetWorkoutPlanTool: userId is required");
        return "Error: userId is required to retrieve workout plans.";
      }

      console.log("🔍 GetWorkoutPlanTool: Connecting to database...");
      await connectDB();
      console.log("✅ GetWorkoutPlanTool: Database connected successfully");

      // Get active workout plans
      console.log("🔍 GetWorkoutPlanTool: Searching for workout plans for userId:", userId);
      const activePlans = await WorkoutPlan.find({ userId, isActive: true })
        .select("name goal difficulty currentWeek stats weeks description")
        .lean();
      
      console.log("📊 GetWorkoutPlanTool: Found", activePlans.length, "active plans");

      if (activePlans.length === 0) {
        console.log("📝 GetWorkoutPlanTool: No active plans found, suggesting to create one");
        return "No active workout plans found for this user. Would you like me to help you create one?";
      }

      console.log("📝 GetWorkoutPlanTool: Generating response for", activePlans.length, "plans");
      let response = "Your Current Workout Plans:\n\n";
      
      for (const plan of activePlans) {
        response += `📋 **${plan.name}**\n`;
        response += `Goal: ${plan.goal}\n`;
        response += `Difficulty: ${plan.difficulty}\n`;
        response += `Current Week: ${plan.currentWeek}\n`;
        response += `Progress: ${plan.stats?.completionRate || 0}% complete\n`;
        response += `Total Workouts: ${plan.stats?.totalWorkouts || 0}\n`;
        
        if (plan.description) {
          response += `Description: ${plan.description}\n`;
        }

        // Add weekly schedule if available
        if (plan.weeks && plan.weeks.length > 0) {
          response += `\n📅 **Weekly Schedule:**\n`;
          plan.weeks.forEach((week, weekIndex) => {
            response += `Week ${weekIndex + 1}: ${week.length} workouts\n`;
          });
        }

        response += `\n---\n\n`;
      }

      console.log("✅ GetWorkoutPlanTool: Successfully generated response");
      return response;
    } catch (error) {
      console.error("❌ GetWorkoutPlanTool error:", error);
      return `Error retrieving workout plans: ${error.message}`;
    }
  }
}

// Utility functions

function formatExercisesToWeeks(exercises, experience) {
  // Dummy implementation: split exercises into weeks based on experience
  if (!Array.isArray(exercises)) return [];
  const weeks = [];
  const perWeek = experience?.toLowerCase() === "beginner" ? 3 : 5;
  for (let i = 0; i < exercises.length; i += perWeek) {
    weeks.push(exercises.slice(i, i + perWeek));
  }
  return weeks;
}

function extractTargetMuscles(exercises) {
  if (!Array.isArray(exercises)) return [];
  const muscles = new Set();
  exercises.forEach((ex) => {
    if (ex.targetMuscle) muscles.add(ex.targetMuscle);
    if (Array.isArray(ex.targetMuscles))
      ex.targetMuscles.forEach((m) => muscles.add(m));
  });
  return Array.from(muscles);
}

function extractEquipment(exercises) {
  if (!Array.isArray(exercises)) return [];
  const equipment = new Set();
  exercises.forEach((ex) => {
    if (ex.equipment) equipment.add(ex.equipment);
    if (Array.isArray(ex.equipments))
      ex.equipments.forEach((eq) => equipment.add(eq));
  });
  return Array.from(equipment);
}
