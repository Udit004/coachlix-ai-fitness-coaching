// models/FitnessEmbedding.js - Schema for Vector Search Documents
import mongoose from 'mongoose';

const FitnessEmbeddingSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    text: true, // Enable text search
  },
  embedding: {
    type: [Number], // Array of numbers for the embedding vector
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Embedding vector cannot be empty'
    }
  },
  metadata: {
    type: {
      type: String,
      required: true,
      enum: ['workout', 'diet', 'exercise', 'nutrition', 'supplement', 'technique'],
      index: true
    },
    title: {
      type: String,
      required: true,
      index: true
    },
    plan: {
      type: String,
      required: true,
      enum: ['general', 'badminton', 'weight-loss', 'muscle-gain', 'strength', 'cardio', 'sports', 'quick'],
      index: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      index: true
    },
    duration: String,
    equipment: [String], // Array of required equipment
    targetMuscles: [String], // Array of target muscle groups
    calories: String,
    tags: [String], // Additional searchable tags
    created: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'fitness_embeddings'
});

// Compound indexes for efficient vector search
FitnessEmbeddingSchema.index({ 
  'metadata.type': 1, 
  'metadata.plan': 1, 
  'metadata.difficulty': 1 
});

FitnessEmbeddingSchema.index({ 
  'metadata.tags': 1,
  isActive: 1 
});

// Text index for fallback text search
FitnessEmbeddingSchema.index({ 
  content: 'text', 
  'metadata.title': 'text',
  'metadata.tags': 'text' 
});

// Static method to find similar content by metadata
FitnessEmbeddingSchema.statics.findByMetadata = function(filters = {}) {
  const query = { isActive: true };
  
  if (filters.type) query['metadata.type'] = filters.type;
  if (filters.plan) query['metadata.plan'] = filters.plan;
  if (filters.difficulty) query['metadata.difficulty'] = filters.difficulty;
  if (filters.equipment) query['metadata.equipment'] = { $in: filters.equipment };
  if (filters.targetMuscles) query['metadata.targetMuscles'] = { $in: filters.targetMuscles };
  
  return this.find(query).sort({ 'metadata.created': -1 });
};

// Static method to get random content for variety
FitnessEmbeddingSchema.statics.getRandomContent = function(type, plan, limit = 3) {
  return this.aggregate([
    { 
      $match: { 
        isActive: true,
        'metadata.type': type,
        'metadata.plan': plan
      } 
    },
    { $sample: { size: limit } }
  ]);
};

const FitnessEmbedding = mongoose.models.FitnessEmbedding || mongoose.model('FitnessEmbedding', FitnessEmbeddingSchema);

export default FitnessEmbedding;