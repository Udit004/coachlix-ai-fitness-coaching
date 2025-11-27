// src/ai/tools/fetchDetailsTool.js
import { Tool } from "@langchain/core/tools";
import { connectDB } from "../../lib/db";
import DietPlan from "../../models/DietPlan";
import WorkoutPlan from "../../models/WorkoutPlan";

/**
 * Tool for fetching detailed diet/workout information
 * Use this when user asks for specific details not in the minimal context
 */
export class FetchDetailsTool extends Tool {
  name = "fetch_details";
  description =
    "Fetch detailed diet or workout information. Input: JSON with userId, type ('diet'|'workout'), detail ('today'|'full'|'specific_day'). Returns detailed information.";

  async _call(input) {
    try {
      console.log("📋 FetchDetailsTool called with input:", input);
      
      const data = JSON.parse(input);
      const { userId, type, detail, dayNumber } = data;

      if (!userId) {
        console.error("❌ FetchDetailsTool: userId is required");
        return "Error: userId is required to fetch details.";
      }

      if (!type) {
        console.error("❌ FetchDetailsTool: type is required");
        return "Error: type ('diet' or 'workout') is required.";
      }

      console.log(`🔍 FetchDetailsTool: Fetching ${type} details for userId: ${userId}`);
      await connectDB();

      if (type === 'diet') {
        return await this.fetchDietDetails(userId, detail, dayNumber);
      } else if (type === 'workout') {
        return await this.fetchWorkoutDetails(userId, detail, dayNumber);
      } else {
        return "Error: Invalid type. Use 'diet' or 'workout'.";
      }

    } catch (error) {
      console.error("❌ FetchDetailsTool error:", error);
      return `Error fetching details: ${error.message}`;
    }
  }

  async fetchDietDetails(userId, detail, dayNumber) {
    try {
      const dietPlan = await DietPlan.findOne({ userId, isActive: true })
        .populate('days.meals.items')
        .lean();

      if (!dietPlan) {
        return "No active diet plan found. Would you like me to create one for you?";
      }

      let response = `📋 Diet Plan: "${dietPlan.name}"\n`;
      response += `Goal: ${dietPlan.goal}\n`;
      response += `Daily Targets: ${dietPlan.targetCalories} kcal, ${dietPlan.targetProtein}g protein, ${dietPlan.targetCarbs}g carbs, ${dietPlan.targetFats}g fats\n\n`;

      // Determine which days to show
      let daysToShow = [];
      
      if (detail === 'today' || !detail) {
        // Show current day
        const currentDay = dietPlan.days[(dietPlan.currentDay || 1) - 1] || dietPlan.days[0];
        daysToShow = [currentDay];
      } else if (detail === 'full') {
        // Show all days (limit to first 7 for readability)
        daysToShow = dietPlan.days.slice(0, 7);
      } else if (detail === 'specific_day' && dayNumber) {
        // Show specific day
        const day = dietPlan.days[dayNumber - 1];
        daysToShow = day ? [day] : [];
      }

      if (daysToShow.length === 0) {
        return "No meal details found for the requested day.";
      }

      // Format meal details
      for (const day of daysToShow) {
        response += `\n📅 Day ${day.dayNumber}:\n`;
        
        if (day.meals && day.meals.length > 0) {
          day.meals.forEach(meal => {
            response += `\n🍽️ ${meal.type} (${meal.totalCalories || 0} cal):\n`;
            
            if (meal.items && meal.items.length > 0) {
              meal.items.forEach(item => {
                response += `  • ${item.name} - ${item.quantity}${item.unit || ''}\n`;
                response += `    ${item.calories || 0} cal | P: ${item.protein || 0}g | C: ${item.carbs || 0}g | F: ${item.fats || 0}g\n`;
                if (item.notes) {
                  response += `    Note: ${item.notes}\n`;
                }
              });
            }
            
            if (meal.instructions) {
              response += `  📝 Instructions: ${meal.instructions}\n`;
            }
          });
          
          // Day totals
          const dayTotals = this.calculateDayTotals(day.meals);
          response += `\n📊 Day ${day.dayNumber} Totals:\n`;
          response += `  Calories: ${dayTotals.calories}/${dietPlan.targetCalories} kcal\n`;
          response += `  Protein: ${dayTotals.protein}/${dietPlan.targetProtein}g\n`;
          response += `  Carbs: ${dayTotals.carbs}/${dietPlan.targetCarbs}g\n`;
          response += `  Fats: ${dayTotals.fats}/${dietPlan.targetFats}g\n`;
        } else {
          response += `  No meals planned for this day yet.\n`;
        }
      }

      console.log("✅ FetchDetailsTool: Diet details fetched successfully");
      return response;

    } catch (error) {
      console.error("❌ Error fetching diet details:", error);
      return `Error fetching diet details: ${error.message}`;
    }
  }

  async fetchWorkoutDetails(userId, detail, dayNumber) {
    try {
      const workoutPlan = await WorkoutPlan.findOne({ userId, isActive: true })
        .populate('weeks.days.workouts.exercises')
        .lean();

      if (!workoutPlan) {
        return "No active workout plan found. Would you like me to create one for you?";
      }

      let response = `💪 Workout Plan: "${workoutPlan.name}"\n`;
      response += `Goal: ${workoutPlan.goal}\n`;
      response += `Difficulty: ${workoutPlan.difficulty}\n`;
      response += `Frequency: ${workoutPlan.workoutFrequency}x per week\n\n`;

      // Get current week
      const currentWeekIndex = (workoutPlan.currentWeek || 1) - 1;
      const currentWeek = workoutPlan.weeks[currentWeekIndex] || workoutPlan.weeks[0];

      if (!currentWeek || !currentWeek.days) {
        return "No workout details found for the current week.";
      }

      let daysToShow = [];
      
      if (detail === 'today' || !detail) {
        // Show today's workout (current day of week)
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const todayWorkout = currentWeek.days[today === 0 ? 6 : today - 1]; // Adjust for Monday = 0
        daysToShow = todayWorkout ? [todayWorkout] : [];
      } else if (detail === 'full') {
        // Show full week
        daysToShow = currentWeek.days;
      } else if (detail === 'specific_day' && dayNumber) {
        // Show specific day
        const day = currentWeek.days[dayNumber - 1];
        daysToShow = day ? [day] : [];
      }

      if (daysToShow.length === 0) {
        return "No workout details found for the requested day.";
      }

      // Format workout details
      daysToShow.forEach((day, dayIndex) => {
        const dayName = this.getDayName(dayIndex);
        
        if (day.isRestDay) {
          response += `\n${dayName}: 🛌 Rest Day\n`;
          if (day.notes) {
            response += `  Note: ${day.notes}\n`;
          }
        } else if (day.workouts && day.workouts.length > 0) {
          response += `\n${dayName}: 🏋️ Workout Day\n`;
          
          day.workouts.forEach(workout => {
            response += `\n  Workout: ${workout.name} (${workout.type})\n`;
            response += `  Duration: ${workout.estimatedDuration || 'N/A'} minutes\n`;
            
            if (workout.exercises && workout.exercises.length > 0) {
              response += `  Exercises:\n`;
              workout.exercises.forEach((exercise, idx) => {
                response += `\n  ${idx + 1}. ${exercise.name}\n`;
                response += `     Target: ${exercise.targetMuscle || 'N/A'}\n`;
                
                if (exercise.sets && exercise.sets.length > 0) {
                  response += `     Sets: `;
                  exercise.sets.forEach((set, setIdx) => {
                    if (setIdx > 0) response += ', ';
                    response += `${set.reps || 'N/A'} reps`;
                    if (set.weight) response += ` @ ${set.weight}`;
                    if (set.duration) response += ` for ${set.duration}s`;
                  });
                  response += `\n`;
                } else if (exercise.defaultSets) {
                  response += `     Sets: ${exercise.defaultSets} x ${exercise.defaultReps || 'N/A'} reps\n`;
                }
                
                if (exercise.restTime) {
                  response += `     Rest: ${exercise.restTime}s between sets\n`;
                }
                if (exercise.instructions) {
                  response += `     Instructions: ${exercise.instructions}\n`;
                }
              });
            }
            
            if (workout.notes) {
              response += `  Notes: ${workout.notes}\n`;
            }
          });
        }
      });

      console.log("✅ FetchDetailsTool: Workout details fetched successfully");
      return response;

    } catch (error) {
      console.error("❌ Error fetching workout details:", error);
      return `Error fetching workout details: ${error.message}`;
    }
  }

  calculateDayTotals(meals) {
    return meals.reduce((totals, meal) => {
      totals.calories += meal.totalCalories || 0;
      totals.protein += meal.totalProtein || 0;
      totals.carbs += meal.totalCarbs || 0;
      totals.fats += meal.totalFats || 0;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }

  getDayName(index) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[index] || `Day ${index + 1}`;
  }
}
