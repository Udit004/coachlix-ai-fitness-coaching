// models/DietPlan.js
import mongoose from 'mongoose';

const FoodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  protein: {
    type: Number,
    required: true,
    min: 0
  },
  carbs: {
    type: Number,
    required: true,
    min: 0
  },
  fats: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: String,
    default: '1 serving'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const MealSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-Workout', 'Post-Workout']
  },
  items: [FoodItemSchema],
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFats: {
    type: Number,
    default: 0
  }
}, { _id: false });

const DaySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true
  },
  meals: [MealSchema],
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFats: {
    type: Number,
    default: 0
  },
  waterIntake: {
    type: Number,
    default: 0 // in liters
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const DietPlanSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500
  },
  goal: {
    type: String,
    required: true,
    enum: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Cutting', 'Bulking', 'General Health']
  },
  targetCalories: {
    type: Number,
    required: true,
    min: 1000,
    max: 5000
  },
  targetProtein: {
    type: Number,
    required: true,
    min: 0
  },
  targetCarbs: {
    type: Number,
    required: true,
    min: 0
  },
  targetFats: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 365 // days
  },
  days: [DaySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: String,
    enum: ['user', 'ai', 'coach'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
DietPlanSchema.index({ userId: 1, createdAt: -1 });
DietPlanSchema.index({ userId: 1, isActive: 1 });
DietPlanSchema.index({ goal: 1 });

// Pre-save middleware to calculate totals
DietPlanSchema.pre('save', function(next) {
  // Calculate totals for each day
  this.days.forEach(day => {
    let dayCalories = 0, dayProtein = 0, dayCarbs = 0, dayFats = 0;
    
    day.meals.forEach(meal => {
      let mealCalories = 0, mealProtein = 0, mealCarbs = 0, mealFats = 0;
      
      meal.items.forEach(item => {
        mealCalories += item.calories || 0;
        mealProtein += item.protein || 0;
        mealCarbs += item.carbs || 0;
        mealFats += item.fats || 0;
      });
      
      meal.totalCalories = mealCalories;
      meal.totalProtein = mealProtein;
      meal.totalCarbs = mealCarbs;
      meal.totalFats = mealFats;
      
      dayCalories += mealCalories;
      dayProtein += mealProtein;
      dayCarbs += mealCarbs;
      dayFats += mealFats;
    });
    
    day.totalCalories = dayCalories;
    day.totalProtein = dayProtein;
    day.totalCarbs = dayCarbs;
    day.totalFats = dayFats;
  });
  
  next();
});

// Instance methods
DietPlanSchema.methods.getAverageCalories = function() {
  if (this.days.length === 0) return 0;
  const totalCalories = this.days.reduce((sum, day) => sum + day.totalCalories, 0);
  return Math.round(totalCalories / this.days.length);
};

DietPlanSchema.methods.getTotalMeals = function() {
  return this.days.reduce((total, day) => total + day.meals.length, 0);
};

DietPlanSchema.methods.getDayByNumber = function(dayNumber) {
  return this.days.find(day => day.dayNumber === dayNumber);
};

// Static methods
DietPlanSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId };
  if (options.activeOnly) query.isActive = true;
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0);
};

DietPlanSchema.statics.findByGoal = function(goal) {
  return this.find({ goal, isActive: true });
};

const DietPlan = mongoose.models.DietPlan || mongoose.model('DietPlan', DietPlanSchema);

export default DietPlan;