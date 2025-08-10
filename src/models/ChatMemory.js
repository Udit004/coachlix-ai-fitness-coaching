// models/ChatMemory.js - MongoDB Schema for LangChain Chat Memory
import mongoose from 'mongoose';

const ChatMemorySchema = new mongoose.Schema({
  SessionId: {
    type: String,
    required: true,
    index: true, // Index for faster queries
  },
  History: [{
    type: {
      type: String,
      required: true,
      enum: ['human', 'ai', 'system', 'function'], // LangChain message types
    },
    data: {
      content: {
        type: String,
        required: true,
      },
      additional_kwargs: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      response_metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'chat_memory' // Specify collection name
});

// Create compound index for efficient queries
ChatMemorySchema.index({ SessionId: 1, createdAt: -1 });

// Middleware to update updatedAt on save
ChatMemorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to clean old messages (optional)
ChatMemorySchema.statics.cleanOldMessages = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  try {
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    console.log(`Cleaned ${result.deletedCount} old chat memory records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning old chat memories:', error);
    return 0;
  }
};

const ChatMemory = mongoose.models.ChatMemory || mongoose.model('ChatMemory', ChatMemorySchema);

export default ChatMemory;