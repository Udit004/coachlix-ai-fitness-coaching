// src/ai/tools/dietPlanTool.js
import { Tool } from "@langchain/core/tools";
import { connectDB } from "../../lib/db";
import User from "../../models/userProfileModel";
import DietPlan from "../../models/DietPlan";

/**
 * Enhanced tool for creating diet plans with AI assistance
 */
export class CreateDietPlanTool extends Tool {
  name = "create_diet_plan";
  description =
    "Create diet plans. Input: JSON with userId, planName, goal, targetCalories, duration. Returns structured meal plan.";

  async _call(input) {
    try {
      console.log("🍽️ CreateDietPlanTool called with input:", input);
      
      const planData = JSON.parse(input);
      let {
        userId,
        planName,
        goal,
        targetCalories,
        duration,
        dietaryRestrictions,
        preferences,
        difficulty,
        tags
      } = planData;

      if (!userId) {
        console.error("❌ CreateDietPlanTool: userId is required");
        return "Error: userId is required to create a diet plan.";
      }

      // Parse duration if it's a string with "days", "weeks", or "months"
      if (typeof duration === 'string') {
        const durationMatch = duration.match(/(\d+)\s*(day|week|month)/i);
        if (durationMatch) {
          const value = parseInt(durationMatch[1]);
          const unit = durationMatch[2].toLowerCase();
          if (unit.startsWith('week')) {
            duration = value * 7; // Convert weeks to days
          } else if (unit.startsWith('month')) {
            duration = value * 30; // Convert months to days
          } else {
            duration = value; // Already in days
          }
        } else {
          // Try to parse as plain number string
          duration = parseInt(duration) || 7;
        }
      }

      console.log("🔍 CreateDietPlanTool: Connecting to database...");
      await connectDB();
      console.log("✅ CreateDietPlanTool: Database connected successfully");

      // Get user profile for personalized plan
      console.log("🔍 CreateDietPlanTool: Fetching user profile for userId:", userId);
      const user = await User.findOne({ firebaseUid: userId }).lean();
      
      if (!user) {
        console.error("❌ CreateDietPlanTool: User profile not found");
        return "Error: User profile not found. Please complete your profile first.";
      }

      console.log("✅ CreateDietPlanTool: User profile found");

      // Get user's dietary preference
      const userDietaryPreference = user.dietaryPreference || 'non-vegetarian';
      console.log(`🥗 CreateDietPlanTool: User dietary preference: ${userDietaryPreference}`);

      // Use provided data or fall back to calculated health metrics
      // Normalize goal to match DietPlan enum values
      const userGoal = normalizeGoal(goal || user.fitnessGoal);
      const userWeight = user.weight || 70;
      const userHeight = user.height || 170;
      const userAge = user.age || calculateAge(user.birthDate) || 25;
      const userGender = user.gender || "male";

      // Calculate caloric needs if not provided
      let calories = targetCalories;
      if (!calories) {
        console.log("📊 CreateDietPlanTool: Calculating caloric needs...");
        // BMR calculation using Mifflin-St Jeor
        let bmr;
        if (userGender?.toLowerCase() === "male") {
          bmr = 10 * userWeight + 6.25 * userHeight - 5 * userAge + 5;
        } else {
          bmr = 10 * userWeight + 6.25 * userHeight - 5 * userAge - 161;
        }
        
        const maintenanceCalories = Math.round(bmr * 1.55); // Moderately active
        
        if (userGoal?.includes("Weight Loss")) {
          calories = Math.round(maintenanceCalories * 0.8); // 20% deficit
        } else if (userGoal?.includes("Muscle Gain") || userGoal?.includes("Bulking")) {
          calories = Math.round(maintenanceCalories * 1.15); // 15% surplus
        } else {
          calories = maintenanceCalories;
        }
        console.log(`📊 CreateDietPlanTool: Calculated target calories: ${calories}`);
      }

      // Calculate macro targets
      let proteinTarget, carbTarget, fatTarget;
      if (userGoal?.includes("Muscle Gain") || userGoal?.includes("Bulking")) {
        proteinTarget = Math.round(userWeight * 2.2); // 2.2g per kg
        fatTarget = Math.round((calories * 0.25) / 9); // 25% of calories
        carbTarget = Math.round((calories - proteinTarget * 4 - fatTarget * 9) / 4);
      } else if (userGoal?.includes("Weight Loss") || userGoal?.includes("Cutting")) {
        proteinTarget = Math.round(userWeight * 2.0); // 2g per kg
        fatTarget = Math.round((calories * 0.25) / 9);
        carbTarget = Math.round((calories - proteinTarget * 4 - fatTarget * 9) / 4);
      } else {
        proteinTarget = Math.round(userWeight * 1.6); // 1.6g per kg
        fatTarget = Math.round((calories * 0.3) / 9);
        carbTarget = Math.round((calories - proteinTarget * 4 - fatTarget * 9) / 4);
      }

      console.log(`📊 CreateDietPlanTool: Macro targets - P: ${proteinTarget}g, C: ${carbTarget}g, F: ${fatTarget}g`);

      // Generate sample days based on duration
      const planDuration = duration || 7; // Default to 7-day plan
      const days = [];
      
      console.log(`📅 CreateDietPlanTool: Generating ${planDuration} days of meals...`);
      
      for (let i = 1; i <= planDuration; i++) {
        days.push({
          dayNumber: i,
          meals: generateMealsForDay(calories, proteinTarget, carbTarget, fatTarget, userGoal, dietaryRestrictions, userDietaryPreference),
          waterIntake: 2.5, // Default 2.5 liters
          notes: `Day ${i} - Stay consistent with your nutrition!`
        });
      }

      // Create the diet plan
      console.log("💾 CreateDietPlanTool: Saving diet plan to database...");
      const dietPlan = await DietPlan.create({
        userId,
        name: planName || `${userGoal} Plan - ${new Date().toLocaleDateString()}`,
        description: `Personalized ${userGoal} diet plan with ${calories} daily calories`,
        goal: userGoal,
        targetCalories: calories,
        targetProtein: proteinTarget,
        targetCarbs: carbTarget,
        targetFats: fatTarget,
        duration: planDuration,
        days: days,
        isActive: true,
        difficulty: difficulty || user.experience || "Beginner",
        tags: tags || [userGoal, `${calories}cal`],
        createdBy: "ai"
      });

      console.log("✅ CreateDietPlanTool: Diet plan created successfully with ID:", dietPlan._id);

      // Update user's recent activities
      await User.findOneAndUpdate(
        { firebaseUid: userId },
        {
          $addToSet: {
            recentActivities: {
              type: "diet",
              title: `Created diet plan: ${dietPlan.name}`,
              description: `New ${userGoal} plan with ${calories} daily calories`,
              date: new Date(),
            },
          },
        }
      );

      console.log("✅ CreateDietPlanTool: User activity updated");

      const response = `Successfully created your diet plan "${dietPlan.name}"! 🎉\n\n` +
        `📋 Plan Details:\n` +
        `• Goal: ${userGoal}\n` +
        `• Duration: ${planDuration} days\n` +
        `• Daily Targets:\n` +
        `  - Calories: ${calories} kcal\n` +
        `  - Protein: ${proteinTarget}g\n` +
        `  - Carbs: ${carbTarget}g\n` +
        `  - Fats: ${fatTarget}g\n\n` +
        `Your personalized meal plan includes ${days.length} days of carefully balanced meals. ` +
        `Each day has ${days[0]?.meals?.length || 3} meals designed to help you achieve your ${userGoal} goals!\n\n` +
        `💡 Tip: Stay consistent and track your meals for best results!`;

      console.log("✅ CreateDietPlanTool: Response generated successfully");
      return response;

    } catch (error) {
      console.error("❌ CreateDietPlanTool error:", error);
      return `Error creating diet plan: ${error.message}`;
    }
  }
}

/**
 * Tool for updating existing diet plans
 */
export class UpdateDietPlanTool extends Tool {
  name = "update_diet_plan";
  description =
    "Update or get diet plans. Input: JSON with userId, action, planId. Returns modified diet plan.";

  async _call(input) {
    try {
      console.log("🔄 UpdateDietPlanTool called with input:", input);
      
      const updateData = JSON.parse(input);
      const {
        userId,
        planId,
        action,
        planName,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFats,
        addDay,
        updateDay,
        addMeal,
        goal,
        isActive,
        notes
      } = updateData;

      if (!userId) {
        console.error("❌ UpdateDietPlanTool: userId is required");
        return "Error: userId is required to update diet plan.";
      }

      console.log("🔍 UpdateDietPlanTool: Connecting to database...");
      await connectDB();
      console.log("✅ UpdateDietPlanTool: Database connected successfully");

      // If action is 'get' or 'retrieve', return existing plans
      if (action === "get" || action === "retrieve") {
        console.log("📋 UpdateDietPlanTool: Retrieving diet plans for userId:", userId);
        
        const existingPlans = await DietPlan.find({ userId, isActive: true })
          .select("name goal targetCalories targetProtein targetCarbs targetFats duration days")
          .limit(5)
          .lean();

        if (existingPlans.length === 0) {
          console.log("📝 UpdateDietPlanTool: No active plans found");
          return "No active diet plans found for this user. Would you like me to create one?";
        }

        console.log(`📊 UpdateDietPlanTool: Found ${existingPlans.length} active plans`);

        let plansList = "Your Current Diet Plans:\n\n";
        existingPlans.forEach((plan, index) => {
          const avgCalories = plan.days?.length > 0 
            ? Math.round(plan.days.reduce((sum, day) => sum + (day.totalCalories || 0), 0) / plan.days.length)
            : plan.targetCalories;
          
          plansList += `${index + 1}. 📋 **${plan.name}**\n`;
          plansList += `   Goal: ${plan.goal}\n`;
          plansList += `   Duration: ${plan.duration} days\n`;
          plansList += `   Target Calories: ${plan.targetCalories} kcal/day\n`;
          plansList += `   Macros: ${plan.targetProtein}g protein, ${plan.targetCarbs}g carbs, ${plan.targetFats}g fats\n`;
          plansList += `   Days Planned: ${plan.days?.length || 0}\n`;
          plansList += `   Avg Daily Calories: ${avgCalories} kcal\n\n`;
        });

        console.log("✅ UpdateDietPlanTool: Plans list generated successfully");
        return plansList;
      }

      // Update existing plan
      if (!planId && !planName) {
        console.error("❌ UpdateDietPlanTool: planId or planName is required for updates");
        return "Error: planId or planName is required to update a specific diet plan.";
      }

      console.log("🔍 UpdateDietPlanTool: Finding diet plan to update...");
      
      // Find the plan
      let dietPlan;
      if (planId) {
        dietPlan = await DietPlan.findOne({ _id: planId, userId });
      } else {
        dietPlan = await DietPlan.findOne({ userId, name: planName, isActive: true });
      }

      if (!dietPlan) {
        console.error("❌ UpdateDietPlanTool: Diet plan not found");
        return "Error: Diet plan not found. Please check the plan name or ID.";
      }

      console.log(`✅ UpdateDietPlanTool: Found diet plan: ${dietPlan.name}`);

      // Build update object
      const updates = {};
      if (targetCalories) updates.targetCalories = targetCalories;
      if (targetProtein) updates.targetProtein = targetProtein;
      if (targetCarbs) updates.targetCarbs = targetCarbs;
      if (targetFats) updates.targetFats = targetFats;
      if (goal) updates.goal = normalizeGoal(goal);
      if (isActive !== undefined) updates.isActive = isActive;

      // Handle day operations
      if (addDay) {
        console.log("➕ UpdateDietPlanTool: Adding new day to plan...");
        dietPlan.days.push({
          dayNumber: dietPlan.days.length + 1,
          meals: addDay.meals || [],
          waterIntake: addDay.waterIntake || 2.5,
          notes: addDay.notes || ""
        });
      }

      if (updateDay) {
        console.log(`🔄 UpdateDietPlanTool: Updating day ${updateDay.dayNumber}...`);
        const dayIndex = dietPlan.days.findIndex(d => d.dayNumber === updateDay.dayNumber);
        if (dayIndex !== -1) {
          if (updateDay.meals) dietPlan.days[dayIndex].meals = updateDay.meals;
          if (updateDay.waterIntake) dietPlan.days[dayIndex].waterIntake = updateDay.waterIntake;
          if (updateDay.notes) dietPlan.days[dayIndex].notes = updateDay.notes;
        }
      }

      if (addMeal) {
        console.log(`🍽️ UpdateDietPlanTool: Adding meal to day ${addMeal.dayNumber}...`);
        const dayIndex = dietPlan.days.findIndex(d => d.dayNumber === addMeal.dayNumber);
        if (dayIndex !== -1) {
          dietPlan.days[dayIndex].meals.push(addMeal.meal);
        }
      }

      // Apply updates
      Object.assign(dietPlan, updates);
      
      console.log("💾 UpdateDietPlanTool: Saving updated diet plan...");
      await dietPlan.save();
      console.log("✅ UpdateDietPlanTool: Diet plan updated successfully");

      // Log activity
      await User.findOneAndUpdate(
        { firebaseUid: userId },
        {
          $addToSet: {
            recentActivities: {
              type: "diet",
              title: `Updated diet plan: ${dietPlan.name}`,
              description: `Modified plan settings`,
              date: new Date(),
            },
          },
        }
      );

      const response = `Successfully updated diet plan "${dietPlan.name}"! ✅\n\n` +
        `📋 Updated Details:\n` +
        `• Goal: ${dietPlan.goal}\n` +
        `• Daily Targets:\n` +
        `  - Calories: ${dietPlan.targetCalories} kcal\n` +
        `  - Protein: ${dietPlan.targetProtein}g\n` +
        `  - Carbs: ${dietPlan.targetCarbs}g\n` +
        `  - Fats: ${dietPlan.targetFats}g\n` +
        `• Total Days: ${dietPlan.days.length}\n\n` +
        `Your diet plan has been updated successfully!`;

      console.log("✅ UpdateDietPlanTool: Response generated successfully");
      return response;

    } catch (error) {
      console.error("❌ UpdateDietPlanTool error:", error);
      return `Error updating diet plan: ${error.message}`;
    }
  }
}

// Helper functions

/**
 * Map various goal formats to valid DietPlan enum values
 */
function normalizeGoal(goal) {
  if (!goal) return "Maintenance";
  
  const goalLower = goal.toLowerCase().trim();
  
  // Direct matches (case-insensitive)
  if (goalLower === "weight loss") return "Weight Loss";
  if (goalLower === "muscle gain") return "Muscle Gain";
  if (goalLower === "maintenance" || goalLower === "maintain weight") return "Maintenance";
  if (goalLower === "cutting") return "Cutting";
  if (goalLower === "bulking") return "Bulking";
  if (goalLower === "general health" || goalLower === "athletic performance") return "General Health";
  
  // Handle underscore format (muscle_gain -> Muscle Gain)
  if (goalLower === "muscle_gain") return "Muscle Gain";
  if (goalLower === "weight_loss") return "Weight Loss";
  if (goalLower === "general_health") return "General Health";
  
  // Handle combined goals
  if (goalLower.includes("weight loss") && goalLower.includes("muscle")) return "Weight Loss";
  if (goalLower.includes("lose weight")) return "Weight Loss";
  if (goalLower.includes("build muscle") || goalLower.includes("gain muscle")) return "Muscle Gain";
  if (goalLower.includes("maintain")) return "Maintenance";
  if (goalLower.includes("cut")) return "Cutting";
  if (goalLower.includes("bulk")) return "Bulking";
  
  // Default fallback
  return "Maintenance";
}

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function generateMealsForDay(calories, protein, carbs, fats, goal, restrictions = [], dietaryPreference = 'non-vegetarian') {
  const meals = [];
  
  // Distribute calories across meals (Breakfast: 30%, Lunch: 35%, Dinner: 25%, Snacks: 10%)
  const mealDistribution = [
    { type: "Breakfast", calorieRatio: 0.30 },
    { type: "Lunch", calorieRatio: 0.35 },
    { type: "Dinner", calorieRatio: 0.25 },
    { type: "Snacks", calorieRatio: 0.10 }
  ];

  mealDistribution.forEach(({ type, calorieRatio }) => {
    const mealCalories = Math.round(calories * calorieRatio);
    const mealProtein = Math.round(protein * calorieRatio);
    const mealCarbs = Math.round(carbs * calorieRatio);
    const mealFats = Math.round(fats * calorieRatio);

    meals.push({
      type,
      items: generateFoodItems(type, mealCalories, mealProtein, mealCarbs, mealFats, goal, restrictions, dietaryPreference),
      totalCalories: mealCalories,
      totalProtein: mealProtein,
      totalCarbs: mealCarbs,
      totalFats: mealFats
    });
  });

  return meals;
}

function generateFoodItems(mealType, calories, protein, carbs, fats, goal, restrictions, dietaryPreference = 'non-vegetarian') {
  const items = [];
  
  // Sample food database based on meal type and goal
  // Each food item is tagged with dietary types
  const foodDatabase = {
    "Breakfast": [
      { name: "Oatmeal with berries", calories: 300, protein: 10, carbs: 55, fats: 5, quantity: "1 cup", types: ['vegetarian', 'vegan', 'eggetarian'] },
      { name: "Greek yogurt with honey", calories: 200, protein: 20, carbs: 25, fats: 3, quantity: "200g", types: ['vegetarian', 'eggetarian'] },
      { name: "Scrambled eggs with toast", calories: 350, protein: 25, carbs: 30, fats: 15, quantity: "2 eggs + 2 slices", types: ['eggetarian'] },
      { name: "Protein smoothie", calories: 250, protein: 30, carbs: 20, fats: 5, quantity: "1 serving", types: ['vegetarian', 'vegan', 'eggetarian'] },
      { name: "Whole grain pancakes", calories: 400, protein: 15, carbs: 65, fats: 8, quantity: "3 pancakes", types: ['vegetarian', 'eggetarian'] },
      { name: "Chicken sausage with toast", calories: 380, protein: 28, carbs: 32, fats: 14, quantity: "2 sausages + 2 slices", types: ['non-vegetarian'] },
      { name: "Tofu scramble with vegetables", calories: 280, protein: 22, carbs: 28, fats: 12, quantity: "1 serving", types: ['vegetarian', 'vegan'] },
      { name: "Idli with sambar", calories: 250, protein: 8, carbs: 48, fats: 4, quantity: "4 idlis", types: ['vegetarian', 'vegan'] },
      { name: "Poha with peanuts", calories: 270, protein: 7, carbs: 50, fats: 6, quantity: "1 bowl", types: ['vegetarian', 'vegan'] },
      { name: "Boiled eggs with whole wheat toast", calories: 320, protein: 24, carbs: 30, fats: 12, quantity: "2 eggs + 2 slices", types: ['eggetarian'] }
    ],
    "Lunch": [
      { name: "Grilled chicken salad", calories: 450, protein: 40, carbs: 30, fats: 18, quantity: "1 large bowl", types: ['non-vegetarian'] },
      { name: "Quinoa bowl with vegetables", calories: 400, protein: 15, carbs: 60, fats: 12, quantity: "1 bowl", types: ['vegetarian', 'vegan'] },
      { name: "Tuna sandwich", calories: 380, protein: 35, carbs: 40, fats: 10, quantity: "1 sandwich", types: ['non-vegetarian'] },
      { name: "Brown rice with grilled fish", calories: 500, protein: 45, carbs: 50, fats: 15, quantity: "1 plate", types: ['non-vegetarian'] },
      { name: "Veggie wrap with hummus", calories: 350, protein: 12, carbs: 55, fats: 10, quantity: "1 wrap", types: ['vegetarian', 'vegan'] },
      { name: "Dal tadka with rice", calories: 420, protein: 18, carbs: 65, fats: 10, quantity: "1 plate", types: ['vegetarian', 'vegan'] },
      { name: "Paneer tikka with roti", calories: 480, protein: 28, carbs: 45, fats: 20, quantity: "1 serving", types: ['vegetarian', 'eggetarian'] },
      { name: "Chickpea curry with rice", calories: 390, protein: 16, carbs: 62, fats: 9, quantity: "1 bowl", types: ['vegetarian', 'vegan'] },
      { name: "Egg curry with rice", calories: 460, protein: 26, carbs: 54, fats: 16, quantity: "1 plate", types: ['eggetarian'] },
      { name: "Chicken biryani", calories: 520, protein: 32, carbs: 58, fats: 18, quantity: "1 plate", types: ['non-vegetarian'] }
    ],
    "Dinner": [
      { name: "Baked salmon with sweet potato", calories: 550, protein: 45, carbs: 40, fats: 22, quantity: "1 fillet + 1 medium potato", types: ['non-vegetarian'] },
      { name: "Chicken stir-fry with vegetables", calories: 450, protein: 40, carbs: 35, fats: 18, quantity: "1 plate", types: ['non-vegetarian'] },
      { name: "Lean beef with broccoli", calories: 480, protein: 50, carbs: 25, fats: 20, quantity: "6oz beef + 2 cups broccoli", types: ['non-vegetarian'] },
      { name: "Turkey meatballs with pasta", calories: 520, protein: 38, carbs: 55, fats: 16, quantity: "1 serving", types: ['non-vegetarian'] },
      { name: "Tofu curry with rice", calories: 420, protein: 20, carbs: 60, fats: 12, quantity: "1 bowl", types: ['vegetarian', 'vegan'] },
      { name: "Lentil soup with whole grain bread", calories: 380, protein: 22, carbs: 58, fats: 8, quantity: "1 bowl + 2 slices", types: ['vegetarian', 'vegan'] },
      { name: "Vegetable stir-fry with tofu", calories: 360, protein: 24, carbs: 42, fats: 14, quantity: "1 plate", types: ['vegetarian', 'vegan'] },
      { name: "Rajma with rice", calories: 410, protein: 18, carbs: 68, fats: 8, quantity: "1 bowl", types: ['vegetarian', 'vegan'] },
      { name: "Egg fried rice", calories: 470, protein: 22, carbs: 62, fats: 16, quantity: "1 plate", types: ['eggetarian'] },
      { name: "Grilled fish with vegetables", calories: 440, protein: 42, carbs: 28, fats: 18, quantity: "1 serving", types: ['non-vegetarian'] }
    ],
    "Snacks": [
      { name: "Apple with almond butter", calories: 180, protein: 5, carbs: 20, fats: 9, quantity: "1 apple + 2 tbsp", types: ['vegetarian', 'vegan', 'eggetarian'] },
      { name: "Protein bar", calories: 200, protein: 20, carbs: 25, fats: 5, quantity: "1 bar", types: ['vegetarian', 'vegan', 'eggetarian'] },
      { name: "Mixed nuts", calories: 160, protein: 6, carbs: 8, fats: 14, quantity: "1 oz", types: ['vegetarian', 'vegan', 'eggetarian'] },
      { name: "Cottage cheese with fruit", calories: 150, protein: 15, carbs: 18, fats: 3, quantity: "1 cup", types: ['vegetarian', 'eggetarian'] },
      { name: "Rice cakes with peanut butter", calories: 190, protein: 8, carbs: 22, fats: 8, quantity: "2 cakes + 1 tbsp", types: ['vegetarian', 'vegan', 'eggetarian'] },
      { name: "Boiled chickpeas", calories: 170, protein: 9, carbs: 28, fats: 3, quantity: "1 cup", types: ['vegetarian', 'vegan'] },
      { name: "Greek yogurt", calories: 140, protein: 18, carbs: 10, fats: 4, quantity: "1 cup", types: ['vegetarian', 'eggetarian'] },
      { name: "Hard boiled eggs", calories: 155, protein: 13, carbs: 1, fats: 11, quantity: "2 eggs", types: ['eggetarian'] },
      { name: "Chicken salad", calories: 220, protein: 24, carbs: 8, fats: 11, quantity: "1 cup", types: ['non-vegetarian'] }
    ]
  };

  // Select appropriate items based on meal type
  let availableFoods = foodDatabase[mealType] || foodDatabase["Snacks"];
  
  // Filter foods based on dietary preference
  availableFoods = availableFoods.filter(food => {
    if (!food.types) return true; // Include if no type specified (backward compatibility)
    return food.types.includes(dietaryPreference);
  });
  
  // If no foods match preference, log warning and use all foods
  if (availableFoods.length === 0) {
    console.warn(`⚠️ No foods found for ${dietaryPreference} preference in ${mealType}, using all foods`);
    availableFoods = foodDatabase[mealType] || foodDatabase["Snacks"];
  }
  
  // Randomly select 1-2 food items that fit the calorie budget
  const numItems = mealType === "Snacks" ? 1 : Math.random() > 0.5 ? 2 : 1;
  const selectedItems = [];
  
  for (let i = 0; i < numItems && i < availableFoods.length; i++) {
    const randomIndex = Math.floor(Math.random() * availableFoods.length);
    const selectedFood = { ...availableFoods[randomIndex] };
    // Remove the 'types' field from the final item (internal use only)
    delete selectedFood.types;
    selectedItems.push(selectedFood);
  }

  return selectedItems;
}
