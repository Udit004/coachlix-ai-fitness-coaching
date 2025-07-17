// src/models/userProfileModel.js
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  earned: {
    type: Boolean,
    default: false
  },
  earnedDate: {
    type: Date
  }
});

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['workout', 'diet', 'goal', 'achievement'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  duration: String,
  calories: Number,
  date: {
    type: Date,
    default: Date.now
  }
});

const statsSchema = new mongoose.Schema({
  workoutsCompleted: {
    type: Number,
    default: 0
  },
  daysStreak: {
    type: Number,
    default: 0
  },
  caloriesBurned: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  }
});

const userProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firebaseUid: {
    type: String,
    required: true
  },
  pushToken: {
    type: String,
    default: null,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  birthDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Birth date cannot be in the future'
    }
  },
  fitnessGoal: {
    type: String,
    enum: [
      'Weight Loss',
      'Muscle Gain', 
      'Weight Loss & Muscle Gain',
      'Maintain Weight',
      'Athletic Performance'
    ],
    default: 'Weight Loss'
  },
  experience: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  height: {
    type: String,
    trim: true
  },
  weight: {
    type: String,
    trim: true
  },
  targetWeight: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  stats: {
    type: statsSchema,
    default: () => ({})
  },
  achievements: [achievementSchema],
  recentActivities: [activitySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update 'updatedAt' field
userProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for age calculation
userProfileSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Instance method to add achievement
userProfileSchema.methods.addAchievement = function(title, description, icon) {
  this.achievements.push({
    title,
    description,
    icon,
    earned: true,
    earnedDate: new Date()
  });
  return this.save();
};

// Instance method to add activity
userProfileSchema.methods.addActivity = function(type, title, description, duration, calories) {
  this.recentActivities.unshift({
    type,
    title,
    description,
    duration,
    calories,
    date: new Date()
  });
  
  // Keep only last 20 activities
  if (this.recentActivities.length > 20) {
    this.recentActivities = this.recentActivities.slice(0, 20);
  }
  
  return this.save();
};

// Instance method to update stats
userProfileSchema.methods.updateStats = function(statsUpdate) {
  this.stats = { ...this.stats.toObject(), ...statsUpdate };
  return this.save();
};

// Static method to find active users
userProfileSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Indexes for performance
userProfileSchema.index({ createdAt: -1 });
userProfileSchema.index({ isActive: 1 });
userProfileSchema.index({ firebaseUid: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userProfileSchema);

export default User;