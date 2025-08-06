// models/ChatSession.js
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'ai'],
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  suggestions: [{
    type: String
  }],
  isError: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const ChatSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  plan: {
    type: String,
    required: true,
    enum: ['general', 'badminton', 'weight-loss', 'muscle-gain', 'strength', 'cardio', 'sports', 'quick'],
    default: 'general',
  },
  messages: [MessageSchema],
  messageCount: {
    type: Number,
    default: 0,
  },
  lastMessage: {
    type: String,
    maxlength: 200,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [{
    type: String,
    maxlength: 20
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ChatSessionSchema.index({ userId: 1, updatedAt: -1 });
ChatSessionSchema.index({ userId: 1, isActive: 1, updatedAt: -1 });
ChatSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Pre-save middleware to update messageCount and lastMessage
ChatSessionSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.messageCount = this.messages.length;
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = lastMsg.content.substring(0, 200);
  }
  next();
});

// Virtual for formatted creation date
ChatSessionSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Static method to find user chats with pagination
ChatSessionSchema.statics.findUserChats = function(userId, options = {}) {
  const { limit = 20, skip = 0, plan = null } = options;
  
  const query = { userId, isActive: true };
  if (plan) query.plan = plan;
  
  return this.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('title plan messageCount lastMessage createdAt updatedAt');
};

// Instance method to add message
ChatSessionSchema.methods.addMessage = function(role, content, suggestions = []) {
  this.messages.push({
    role,
    content,
    suggestions,
    timestamp: new Date()
  });
  return this.save();
};

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);