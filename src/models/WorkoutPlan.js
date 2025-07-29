// models/WorkoutPlan.js
import mongoose from 'mongoose';

const SetSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: true,
    min: 1
  },
  weight: {
    type: Number,
    min: 0,
    default: 0 // bodyweight exercises
  },
  duration: {
    type: Number, // in seconds for timed exercises
    min: 0
  },
  distance: {
    type: Number, // for cardio exercises (meters/miles)
    min: 0
  },
  restTime: {
    type: Number, // rest after this set in seconds
    min: 0,
    default: 60
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Strength', 'Cardio', 'Flexibility', 'Sports', 'Functional']
  },
  muscleGroups: [{
    type: String,
    enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Calves', 'Forearms', 'Full Body']
  }],
  equipment: [{
    type: String,
    enum: ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Resistance Band', 'Kettlebell', 'Medicine Ball', 'TRX', 'Cardio Equipment']
  }],
  sets: [SetSchema],
  targetSets: {
    type: Number,
    min: 1,
    default: 3
  },
  targetReps: {
    type: String, // e.g., "8-12", "15", "AMRAP"
    default: "8-12"
  },
  targetWeight: {
    type: Number,
    min: 0
  },
  instructions: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  personalRecord: {
    weight: { type: Number, min: 0 },
    reps: { type: Number, min: 0 },
    date: { type: Date }
  }
}, { _id: false });

const WorkoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Strength', 'Cardio', 'HIIT', 'Circuit', 'Flexibility', 'Sports', 'Recovery']
  },
  exercises: [ExerciseSchema],
  estimatedDuration: {
    type: Number, // in minutes
    min: 5,
    default: 60
  },
  actualDuration: {
    type: Number, // actual time spent
    min: 0
  },
  intensity: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Max'],
    default: 'Moderate'
  },
  caloriesBurned: {
    type: Number,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const DaySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  dayName: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  isRestDay: {
    type: Boolean,
    default: false
  },
  workouts: [WorkoutSchema],
  totalDuration: {
    type: Number,
    default: 0
  },
  totalCaloriesBurned: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const WeekSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true,
    min: 1
  },
  days: [DaySchema],
  weeklyGoal: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  totalWorkouts: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  }
}, { _id: false });

const ProgressEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  weight: {
    type: Number,
    min: 0
  },
  bodyFat: {
    type: Number,
    min: 0,
    max: 100
  },
  measurements: {
    chest: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    hips: { type: Number, min: 0 },
    arms: { type: Number, min: 0 },
    thighs: { type: Number, min: 0 }
  },
  photos: [{
    url: String,
    type: {
      type: String,
      enum: ['front', 'side', 'back']
    }
  }],
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const WorkoutPlanSchema = new mongoose.Schema({
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
    enum: ['Strength Building', 'Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness', 'Athletic Performance', 'Rehabilitation']
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 52 // weeks
  },
  workoutFrequency: {
    type: Number,
    min: 1,
    max: 7,
    default: 3 // workouts per week
  },
  weeks: [WeekSchema],
  targetMuscleGroups: [{
    type: String,
    enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Calves', 'Forearms', 'Full Body']
  }],
  equipment: [{
    type: String,
    enum: ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Resistance Band', 'Kettlebell', 'Medicine Ball', 'TRX', 'Cardio Equipment']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: String,
    enum: ['user', 'ai', 'trainer', 'template'],
    default: 'user'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan'
  },
  currentWeek: {
    type: Number,
    min: 1,
    default: 1
  },
  startDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  progress: [ProgressEntrySchema],
  stats: {
    totalWorkouts: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }, // minutes
    totalCalories: { type: Number, default: 0 },
    averageWorkoutDuration: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // percentage
    strongestLifts: [{
      exercise: String,
      weight: Number,
      reps: Number,
      date: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
WorkoutPlanSchema.index({ userId: 1, createdAt: -1 });
WorkoutPlanSchema.index({ userId: 1, isActive: 1 });
WorkoutPlanSchema.index({ goal: 1 });
WorkoutPlanSchema.index({ difficulty: 1 });
WorkoutPlanSchema.index({ isTemplate: 1, isPublic: 1 });
WorkoutPlanSchema.index({ 'tags': 1 });

// Pre-save middleware to calculate totals and stats
WorkoutPlanSchema.pre('save', function(next) {
  // Calculate totals for each week
  this.weeks.forEach(week => {
    let weekWorkouts = 0, weekDuration = 0;
    
    week.days.forEach(day => {
      let dayDuration = 0, dayCalories = 0;
      
      if (!day.isRestDay) {
        day.workouts.forEach(workout => {
          weekWorkouts++;
          dayDuration += workout.actualDuration || workout.estimatedDuration || 0;
          dayCalories += workout.caloriesBurned || 0;
        });
      }
      
      day.totalDuration = dayDuration;
      day.totalCaloriesBurned = dayCalories;
      weekDuration += dayDuration;
    });
    
    week.totalWorkouts = weekWorkouts;
    week.totalDuration = weekDuration;
  });
  
  // Calculate overall stats
  const totalWorkouts = this.weeks.reduce((sum, week) => sum + week.totalWorkouts, 0);
  const totalDuration = this.weeks.reduce((sum, week) => sum + week.totalDuration, 0);
  const totalCalories = this.weeks.reduce((sum, week) => 
    sum + week.days.reduce((daySum, day) => daySum + day.totalCaloriesBurned, 0), 0);
  
  this.stats.totalWorkouts = totalWorkouts;
  this.stats.totalDuration = totalDuration;
  this.stats.totalCalories = totalCalories;
  this.stats.averageWorkoutDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
  
  // Calculate completion rate
  const totalPossibleWorkouts = this.weeks.length * this.workoutFrequency;
  this.stats.completionRate = totalPossibleWorkouts > 0 ? 
    Math.round((totalWorkouts / totalPossibleWorkouts) * 100) : 0;
  
  next();
});

// Instance methods
WorkoutPlanSchema.methods.getCurrentWeek = function() {
  return this.weeks.find(week => week.weekNumber === this.currentWeek);
};

WorkoutPlanSchema.methods.getWeekByNumber = function(weekNumber) {
  return this.weeks.find(week => week.weekNumber === weekNumber);
};

WorkoutPlanSchema.methods.getTotalExercises = function() {
  return this.weeks.reduce((total, week) => 
    total + week.days.reduce((dayTotal, day) => 
      dayTotal + day.workouts.reduce((workoutTotal, workout) => 
        workoutTotal + workout.exercises.length, 0), 0), 0);
};

WorkoutPlanSchema.methods.getCompletionPercentage = function() {
  const totalExercises = this.getTotalExercises();
  if (totalExercises === 0) return 0;
  
  const completedExercises = this.weeks.reduce((total, week) => 
    total + week.days.reduce((dayTotal, day) => 
      dayTotal + day.workouts.reduce((workoutTotal, workout) => 
        workoutTotal + workout.exercises.filter(ex => ex.isCompleted).length, 0), 0), 0);
  
  return Math.round((completedExercises / totalExercises) * 100);
};

WorkoutPlanSchema.methods.addProgressEntry = function(progressData) {
  this.progress.push(progressData);
  this.progress.sort((a, b) => new Date(b.date) - new Date(a.date));
  return this.save();
};

// Static methods
WorkoutPlanSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId };
  if (options.activeOnly) query.isActive = true;
  if (options.templatesOnly) query.isTemplate = true;
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0);
};

WorkoutPlanSchema.statics.findByGoal = function(goal) {
  return this.find({ goal, isActive: true });
};

WorkoutPlanSchema.statics.findTemplates = function() {
  return this.find({ isTemplate: true, isPublic: true });
};

WorkoutPlanSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isPublic: true })
    .sort({ 'stats.totalWorkouts': -1 })
    .limit(limit);
};

const WorkoutPlan = mongoose.models.WorkoutPlan || mongoose.model('WorkoutPlan', WorkoutPlanSchema);

export default WorkoutPlan;