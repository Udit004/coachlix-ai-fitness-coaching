// lib/enhancedVectorSearch.js - Enhanced Vector Search with Pinecone + MongoDB Fallback
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB } from "./db.js";
import FitnessEmbedding from "../models/FitnessEmbedding.js";
import User from "../models/userProfileModel.js";
import pineconeDB from "./pineconeVectorDB.js";
import cache from "./simpleCache.js";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "text-embedding-004", // Fixed: Use current stable embedding model
});

// Configuration
const USE_PINECONE = process.env.USE_PINECONE === 'true' && process.env.PINECONE_API_KEY;
const CACHE_TTL = 300; // 5 minutes for search results

/**
 * Enhanced vector search with automatic fallback
 */
export async function enhancedVectorSearch(query, userId, filters = {}, limit = 10) {
  try {
    // Check cache first
    const cacheKey = `vector_search:${userId}:${query}:${JSON.stringify(filters)}:${limit}`;
    const cachedResults = cache.get(cacheKey);
    if (cachedResults) {
      console.log('✅ Vector search cache hit');
      return cachedResults;
    }

    let results = [];

    // Try Pinecone first if available
    if (USE_PINECONE) {
      try {
        console.log('🔍 Using Pinecone for vector search...');
        results = await pineconeDB.search(query, userId, filters, limit);
        
        if (results && results.length > 0) {
          console.log(`✅ Pinecone search successful: ${results.length} results`);
          
          // Cache results
          cache.set(cacheKey, results, CACHE_TTL);
          return results;
        }
      } catch (error) {
        console.error('❌ Pinecone search failed, falling back to MongoDB:', error);
      }
    }

    // Fallback to MongoDB vector search
    console.log('🔍 Using MongoDB for vector search...');
    results = await mongoDBVectorSearch(query, userId, filters, limit);
    
    // Cache results
    cache.set(cacheKey, results, CACHE_TTL);
    return results;

  } catch (error) {
    console.error('Error in enhanced vector search:', error);
    return [];
  }
}

/**
 * MongoDB vector search (existing implementation)
 */
async function mongoDBVectorSearch(query, userId, filters = {}, limit = 10) {
  try {
    await connectDB();
    
    // Get user profile for personalization
    const user = await User.findOne({ firebaseUid: userId })
      .select('fitnessGoal experience availableEquipment dietaryPreference medicalConditions')
      .lean();
    
    // Generate query embedding
    const queryEmbedding = await embeddings.embedQuery(query);
    
    // Build personalized search filters
    const searchFilters = buildPersonalizedFilters(user, query, filters);
    
    // Perform vector similarity search with MongoDB aggregation
    const results = await performMongoDBSearch(queryEmbedding, searchFilters, limit * 2);
    
    // Re-rank results based on user context
    const rerankedResults = reRankByUserContext(results, user, query);
    
    // Format results with enhanced context
    return formatEnhancedResults(rerankedResults.slice(0, limit), user);
    
  } catch (error) {
    console.error("Error in MongoDB vector search:", error);
    return [];
  }
}

/**
 * Build search filters based on user profile
 */
function buildPersonalizedFilters(user, query, additionalFilters = {}) {
  const filters = { isActive: true, ...additionalFilters };
  const queryLower = query.toLowerCase();
  
  // Plan-based filtering
  if (user?.fitnessGoal) {
    if (user.fitnessGoal.toLowerCase().includes('weight loss')) {
      filters['metadata.plan'] = { $in: ['weight-loss', 'cardio', 'general'] };
    } else if (user.fitnessGoal.toLowerCase().includes('muscle gain')) {
      filters['metadata.plan'] = { $in: ['muscle-gain', 'strength', 'general'] };
    } else if (user.fitnessGoal.toLowerCase().includes('badminton')) {
      filters['metadata.plan'] = { $in: ['badminton', 'sports', 'general'] };
    }
  }
  
  // Experience level filtering
  if (user?.experience) {
    const experienceLevel = user.experience.toLowerCase();
    if (experienceLevel === 'beginner') {
      filters['metadata.difficulty'] = { $in: ['beginner', 'easy'] };
    } else if (experienceLevel === 'advanced') {
      filters['metadata.difficulty'] = { $in: ['intermediate', 'advanced'] };
    }
  }
  
  // Equipment-based filtering
  if (user?.availableEquipment && user.availableEquipment.length > 0) {
    filters.$or = [
      { 'metadata.equipment': { $in: user.availableEquipment } },
      { 'metadata.equipment': { $in: ['none', 'bodyweight'] } },
      { 'metadata.equipment': { $size: 0 } }
    ];
  }
  
  // Content type filtering based on query
  if (queryLower.includes('workout') || queryLower.includes('exercise')) {
    filters['metadata.type'] = { $in: ['workout', 'exercise', 'technique'] };
  } else if (queryLower.includes('diet') || queryLower.includes('nutrition') || queryLower.includes('meal')) {
    filters['metadata.type'] = { $in: ['nutrition', 'diet'] };
  }
  
  return filters;
}

/**
 * Perform vector similarity search with MongoDB aggregation
 */
async function performMongoDBSearch(queryEmbedding, filters, limit) {
  try {
    const pipeline = [
      { $match: filters },
      {
        $addFields: {
          similarity: {
            $let: {
              vars: {
                dotProduct: {
                  $reduce: {
                    input: { $zip: { inputs: ["$embedding", queryEmbedding] } },
                    initialValue: 0,
                    in: { $add: ["$value", { $multiply: [{ $arrayElemAt: ["$this", 0] }, { $arrayElemAt: ["$this", 1] }] }] }
                  }
                }
              },
              in: "$dotProduct"
            }
          }
        }
      },
      { $sort: { similarity: -1 } },
      { $limit: limit },
      {
        $project: {
          content: 1,
          metadata: 1,
          similarity: 1,
          isActive: 1
        }
      }
    ];
    
    const results = await FitnessEmbedding.aggregate(pipeline);
    return results;
    
  } catch (error) {
    console.error("Error in MongoDB vector similarity search:", error);
    
    // Fallback to text search
    return await FitnessEmbedding.find(filters)
      .sort({ 'metadata.created': -1 })
      .limit(limit)
      .lean();
  }
}

/**
 * Re-rank results based on user context and preferences
 */
function reRankByUserContext(results, user, query) {
  const queryLower = query.toLowerCase();
  
  return results.map(result => {
    let relevanceScore = result.similarity || 0.5;
    
    // Boost score based on user's fitness goal alignment
    if (user?.fitnessGoal && result.metadata) {
      const goalMatch = checkGoalAlignment(user.fitnessGoal, result.metadata.plan, result.metadata.tags);
      relevanceScore += goalMatch * 0.3;
    }
    
    // Boost score based on experience level match
    if (user?.experience && result.metadata?.difficulty) {
      const expMatch = checkExperienceMatch(user.experience, result.metadata.difficulty);
      relevanceScore += expMatch * 0.2;
    }
    
    // Boost score for equipment compatibility
    if (user?.availableEquipment && result.metadata?.equipment) {
      const equipmentMatch = checkEquipmentCompatibility(user.availableEquipment, result.metadata.equipment);
      relevanceScore += equipmentMatch * 0.15;
    }
    
    // Query-specific boosts
    if (queryLower.includes('beginner') && result.metadata?.difficulty === 'beginner') {
      relevanceScore += 0.2;
    }
    if (queryLower.includes('quick') && result.metadata?.tags?.includes('quick')) {
      relevanceScore += 0.15;
    }
    
    return {
      ...result,
      finalRelevanceScore: Math.min(relevanceScore, 1.0)
    };
  }).sort((a, b) => b.finalRelevanceScore - a.finalRelevanceScore);
}

/**
 * Check alignment between user's goal and content
 */
function checkGoalAlignment(userGoal, contentPlan, contentTags) {
  if (!userGoal || !contentPlan) return 0;
  
  const goalLower = userGoal.toLowerCase();
  const planLower = contentPlan.toLowerCase();
  
  if (goalLower.includes('weight loss') && planLower.includes('weight-loss')) return 1.0;
  if (goalLower.includes('muscle gain') && planLower.includes('muscle-gain')) return 1.0;
  if (goalLower.includes('badminton') && planLower.includes('badminton')) return 1.0;
  if (goalLower.includes('strength') && planLower.includes('strength')) return 1.0;
  
  if (contentTags && Array.isArray(contentTags)) {
    const tagMatch = contentTags.some(tag => goalLower.includes(tag.toLowerCase()));
    if (tagMatch) return 0.7;
  }
  
  if (planLower === 'general') return 0.5;
  
  return 0;
}

/**
 * Check experience level compatibility
 */
function checkExperienceMatch(userExp, contentDifficulty) {
  if (!userExp || !contentDifficulty) return 0;
  
  const expLower = userExp.toLowerCase();
  const diffLower = contentDifficulty.toLowerCase();
  
  if (expLower === diffLower) return 1.0;
  if (expLower === 'beginner' && diffLower === 'easy') return 1.0;
  if (expLower === 'intermediate' && (diffLower === 'beginner' || diffLower === 'easy')) return 0.7;
  if (expLower === 'advanced' && diffLower === 'intermediate') return 0.8;
  if (expLower === 'beginner' && diffLower === 'intermediate') return 0.3;
  
  return 0;
}

/**
 * Check equipment compatibility
 */
function checkEquipmentCompatibility(userEquipment, contentEquipment) {
  if (!contentEquipment || contentEquipment.length === 0) return 1.0;
  if (!userEquipment || userEquipment.length === 0) return 0;
  
  const hasAllEquipment = contentEquipment.every(item => 
    userEquipment.some(userItem => 
      userItem.toLowerCase().includes(item.toLowerCase()) || 
      item.toLowerCase().includes(userItem.toLowerCase())
    )
  );
  
  if (hasAllEquipment) return 1.0;
  
  const partialMatch = contentEquipment.filter(item =>
    userEquipment.some(userItem => 
      userItem.toLowerCase().includes(item.toLowerCase()) || 
      item.toLowerCase().includes(userItem.toLowerCase())
    )
  ).length / contentEquipment.length;
  
  return partialMatch;
}

/**
 * Format results with enhanced context for LLM
 */
function formatEnhancedResults(results, user) {
  if (!results || results.length === 0) return [];
  
  return results.map(result => ({
    content: result.content,
    metadata: {
      ...result.metadata,
      relevanceScore: result.finalRelevanceScore,
      personalizedFor: {
        goal: user?.fitnessGoal,
        experience: user?.experience,
        equipment: user?.availableEquipment
      }
    },
    formattedContent: formatContentForContext(result, user)
  }));
}

/**
 * Format content with user-specific context
 */
function formatContentForContext(result, user) {
  let formatted = `\n📚 ${result.metadata?.title || 'Fitness Content'}`;
  
  if (result.finalRelevanceScore > 0.8) {
    formatted += ` ⭐ (Highly Recommended)`;
  } else if (result.finalRelevanceScore > 0.6) {
    formatted += ` 👍 (Good Match)`;
  }
  
  formatted += `\n${result.content}`;
  
  if (user && result.metadata) {
    const personalNotes = generatePersonalizedNotes(result.metadata, user);
    if (personalNotes) {
      formatted += `\n💡 Personal Note: ${personalNotes}`;
    }
  }
  
  return formatted;
}

/**
 * Generate personalized notes based on user profile
 */
function generatePersonalizedNotes(metadata, user) {
  const notes = [];
  
  if (user.experience === 'beginner' && metadata.difficulty === 'intermediate') {
    notes.push("This might be challenging for your current level - consider starting with easier variations");
  } else if (user.experience === 'advanced' && metadata.difficulty === 'beginner') {
    notes.push("You can probably increase intensity or add variations to make this more challenging");
  }
  
  if (metadata.equipment && metadata.equipment.length > 0) {
    const hasEquipment = user.availableEquipment && 
      metadata.equipment.every(item => user.availableEquipment.includes(item));
    if (!hasEquipment) {
      notes.push("Consider equipment alternatives or modifications based on what you have available");
    }
  }
  
  if (user.fitnessGoal && metadata.plan) {
    const goalLower = user.fitnessGoal.toLowerCase();
    const planLower = metadata.plan.toLowerCase();
    
    if (goalLower.includes('weight loss') && planLower === 'muscle-gain') {
      notes.push("This content focuses on muscle gain - adjust portions and add cardio for weight loss");
    } else if (goalLower.includes('muscle gain') && planLower === 'weight-loss') {
      notes.push("This is weight loss focused - increase calories and protein for muscle gain");
    }
  }
  
  return notes.length > 0 ? notes.join('; ') : null;
}

/**
 * Hybrid search combining vector and traditional search
 */
export async function hybridSearch(query, userId, limit = 10) {
  try {
    const [vectorResults, textResults] = await Promise.all([
      enhancedVectorSearch(query, userId, {}, Math.ceil(limit * 0.7)),
      traditionalSearch(query, userId, Math.ceil(limit * 0.5))
    ]);
    
    const combinedResults = mergeSearchResults(vectorResults, textResults);
    return combinedResults.slice(0, limit);
    
  } catch (error) {
    console.error("Error in hybrid search:", error);
    return [];
  }
}

/**
 * Traditional MongoDB text search as fallback
 */
async function traditionalSearch(query, userId, limit) {
  try {
    const user = await User.findOne({ firebaseUid: userId }).lean();
    const filters = buildPersonalizedFilters(user, query);
    
    return await FitnessEmbedding.find({
      ...filters,
      $text: { $search: query }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();
    
  } catch (error) {
    console.error("Error in traditional search:", error);
    return [];
  }
}

/**
 * Merge and deduplicate search results
 */
function mergeSearchResults(vectorResults, textResults) {
  const seen = new Set();
  const merged = [];
  
  for (const result of vectorResults) {
    const id = result._id?.toString() || result.metadata?.title;
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push({ ...result, source: 'vector' });
    }
  }
  
  for (const result of textResults) {
    const id = result._id?.toString() || result.metadata?.title;
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push({ ...result, source: 'text' });
    }
  }
  
  return merged;
}

/**
 * Migrate existing MongoDB embeddings to Pinecone
 */
export async function migrateToPinecone() {
  if (!USE_PINECONE) {
    console.log('❌ Pinecone not configured, skipping migration');
    return false;
  }

  try {
    await connectDB();
    
    // Get all active embeddings from MongoDB
    const embeddings = await FitnessEmbedding.find({ isActive: true }).lean();
    console.log(`📦 Found ${embeddings.length} embeddings to migrate`);
    
    // Prepare content for Pinecone
    const contents = embeddings.map(embedding => ({
      id: embedding._id.toString(),
      content: embedding.content,
      metadata: {
        ...embedding.metadata,
        id: embedding._id.toString(),
        userId: 'global', // Mark as global content
        isActive: true
      }
    }));
    
    // Batch upsert to Pinecone
    const success = await pineconeDB.batchUpsert(contents);
    
    if (success) {
      console.log(`✅ Successfully migrated ${contents.length} embeddings to Pinecone`);
      return true;
    } else {
      console.log('❌ Failed to migrate embeddings to Pinecone');
      return false;
    }
    
  } catch (error) {
    console.error('Error migrating to Pinecone:', error);
    return false;
  }
}

/**
 * Get search performance metrics
 */
export async function getSearchMetrics() {
  const metrics = {
    pineconeEnabled: USE_PINECONE,
    cacheStats: cache.getStats(),
    mongoDBStats: null,
    pineconeStats: null
  };
  
  try {
    // Get MongoDB stats
    await connectDB();
    const mongoCount = await FitnessEmbedding.countDocuments({ isActive: true });
    metrics.mongoDBStats = { totalEmbeddings: mongoCount };
    
    // Get Pinecone stats if available
    if (USE_PINECONE) {
      const pineconeStats = await pineconeDB.getStats();
      metrics.pineconeStats = pineconeStats;
    }
  } catch (error) {
    console.error('Error getting search metrics:', error);
  }
  
  return metrics;
}

// Export legacy functions for backward compatibility
export const personalizedVectorSearch = enhancedVectorSearch;
export { createPersonalizedKnowledgeBase } from './vectorSearch.js';
