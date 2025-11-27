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
