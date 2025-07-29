// models/Exercise.js
import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Strength', 'Cardio', 'Flexibility', 'Sports', 'Functional', 'Plyometric', 'Balance']
  },
  subcategory: {
    type: String,
    enum: ['Compound', 'Isolation', 'HIIT', 'LISS', 'Static', 'Dynamic', 'Olympic', 'Powerlifting']
  },
  primaryMuscleGroups: [{
    type: String,
    enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Calves', 'Forearms', 'Full Body'],
    required: true
  }],
  secondaryMuscleGroups: [{
    type: String,
    enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Calves', 'Forearms', 'Full Body']
  }],
  equipment: [{
    type: String,
    enum: ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Resistance Band', 'Kettlebell', 'Medicine Ball', 'TRX', 'Cardio Equipment', 'Pull-up Bar', 'Bench'],
    required: true
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  instructions: [{
    step: Number,
    description: String
  }],
  formTips: [{
    type: String,
    trim: true
  }],
  commonMistakes: [{
    type: String,
    trim: true
  }],
  videoUrl: {
    type: String,
    trim: true
  },
  imageUrls: [{
    type: String,
    trim: true
  }],
  variations: [{
    name: String,
    difficulty: {
      type: String,
      enum: ['Easier', 'Same', 'Harder']
    },
    description: String
  }],
  metrics: {
    isWeighted: { type: Boolean, default: true },
    isTimed: { type: Boolean, default: false },
    isDistance: { type: Boolean, default: false },
    hasReps: { type: Boolean, default: true },
    defaultSets: { type: Number, default: 3 },
    defaultReps: { type: String, default: "8-12" },
    defaultRestTime: { type: Number, default: 60 }, // seconds
    caloriesPerMinute: { type: Number, default: 5 }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    enum: ['system', 'admin', 'user'],
    default: 'system'
  },
  popularity: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
ExerciseSchema.index({ category: 1, difficulty: 1 });
ExerciseSchema.index({ primaryMuscleGroups: 1 });
ExerciseSchema.index({ equipment: 1 });
ExerciseSchema.index({ name: 'text', description: 'text' });
ExerciseSchema.index({ popularity: -1 });
ExerciseSchema.index({ averageRating: -1 });

// Static methods
ExerciseSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

ExerciseSchema.statics.findByMuscleGroup = function(muscleGroup) {
  return this.find({ 
    $or: [
      { primaryMuscleGroups: muscleGroup },
      { secondaryMuscleGroups: muscleGroup }
    ],
    isActive: true 
  });
};

ExerciseSchema.statics.findByEquipment = function(equipment) {
  return this.find({ equipment: { $in: equipment }, isActive: true });
};

ExerciseSchema.statics.searchExercises = function(searchTerm, filters = {}) {
  let query = {
    isActive: true,
    $text: { $search: searchTerm }
  };

  if (filters.category) query.category = filters.category;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.equipment) query.equipment = { $in: filters.equipment };
  if (filters.muscleGroups) {
    query.$or = [
      { primaryMuscleGroups: { $in: filters.muscleGroups } },
      { secondaryMuscleGroups: { $in: filters.muscleGroups } }
    ];
  }

  return this.find(query).sort({ score: { $meta: 'textScore' }, popularity: -1 });
};

ExerciseSchema.statics.getPopular = function(limit = 20) {
  return this.find({ isActive: true })
    .sort({ popularity: -1, averageRating: -1 })
    .limit(limit);
};

ExerciseSchema.statics.getRecommended = function(userLevel, equipment, muscleGroups) {
  return this.find({
    isActive: true,
    difficulty: userLevel,
    equipment: { $in: equipment },
    primaryMuscleGroups: { $in: muscleGroups }
  }).sort({ averageRating: -1, popularity: -1 });
};

// Instance methods
ExerciseSchema.methods.addRating = function(rating) {
  const totalScore = this.averageRating * this.totalRatings + rating;
  this.totalRatings += 1;
  this.averageRating = totalScore / this.totalRatings;
  return this.save();
};

ExerciseSchema.methods.incrementPopularity = function() {
  this.popularity += 1;
  return this.save();
};

const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);

export default Exercise;