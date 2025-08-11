// lib/enhancedVectorSearch.js - Personalized Vector Search System
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB } from "./db";
import FitnessEmbedding from "../models/FitnessEmbedding";
import User from "../models/userProfileModel";
import mongoose from "mongoose";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

/**
 * Enhanced personalized vector search
 * @param {string} query - User's query
 * @param {string} userId - User ID for personalization
 * @param {number} limit - Number of results to return
 * @returns {Array} Personalized search results
 */
export async function personalizedVectorSearch(query, userId, limit = 5) {
  try {
    await connectDB();
    
    // Get user profile for personalization
    const user = await User.findOne({ firebaseUid: userId })
      .select('fitnessGoal experience availableEquipment dietaryPreference medicalConditions')
      .lean();
    
    // Generate query embedding
    const queryEmbedding = await embeddings.embedQuery(query);
    
    // Build personalized search filters
    const searchFilters = buildPersonalizedFilters(user, query);
    
    // Perform vector similarity search with personalization
    const results = await performPersonalizedSearch(queryEmbedding, searchFilters, limit * 2);
    
    // Re-rank results based on user context
    const rerankedResults = reRankByUserContext(results, user, query);
    
    // Format results with enhanced context
    return formatEnhancedResults(rerankedResults.slice(0, limit), user);
    
  } catch (error) {
    console.error("Error in personalized vector search:", error);
    return [];
  }
}

/**
 * Build search filters based on user profile
 */
function buildPersonalizedFilters(user, query) {
  const filters = { isActive: true };
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
    // Show content that uses available equipment or no equipment
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
  
  // Dietary preferences
  if (user?.dietaryPreference && (queryLower.includes('food') || queryLower.includes('meal'))) {
    filters['metadata.tags'] = { $in: [user.dietaryPreference.toLowerCase()] };
  }
  
  return filters;
}

/**
 * Perform vector similarity search with MongoDB aggregation
 */
async function performPersonalizedSearch(queryEmbedding, filters, limit) {
  try {
    // Use MongoDB aggregation for vector similarity search
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
    console.error("Error in vector similarity search:", error);
    
    // Fallback to text search if vector search fails
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
    
    // Boost score for recent/popular content
    if (result.metadata?.tags?.includes('popular') || result.metadata?.tags?.includes('trending')) {
      relevanceScore += 0.1;
    }
    
    // Query-specific boosts
    if (queryLower.includes('beginner') && result.metadata?.difficulty === 'beginner') {
      relevanceScore += 0.2;
    }
    if (queryLower.includes('quick') && result.metadata?.tags?.includes('quick')) {
      relevanceScore += 0.15;
    }
    if (queryLower.includes('home') && result.metadata?.equipment?.includes('none')) {
      relevanceScore += 0.15;
    }
    
    return {
      ...result,
      finalRelevanceScore: Math.min(relevanceScore, 1.0) // Cap at 1.0
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
  
  // Direct plan match
  if (goalLower.includes('weight loss') && planLower.includes('weight-loss')) return 1.0;
  if (goalLower.includes('muscle gain') && planLower.includes('muscle-gain')) return 1.0;
  if (goalLower.includes('badminton') && planLower.includes('badminton')) return 1.0;
  if (goalLower.includes('strength') && planLower.includes('strength')) return 1.0;
  
  // Tag-based matching
  if (contentTags && Array.isArray(contentTags)) {
    const tagMatch = contentTags.some(tag => goalLower.includes(tag.toLowerCase()));
    if (tagMatch) return 0.7;
  }
  
  // General fitness match
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
  
  // Perfect matches
  if (expLower === diffLower) return 1.0;
  if (expLower === 'beginner' && diffLower === 'easy') return 1.0;
  
  // Acceptable matches
  if (expLower === 'intermediate' && (diffLower === 'beginner' || diffLower === 'easy')) return 0.7;
  if (expLower === 'advanced' && diffLower === 'intermediate') return 0.8;
  if (expLower === 'beginner' && diffLower === 'intermediate') return 0.3; // Challenging but doable
  
  return 0;
}

/**
 * Check equipment compatibility
 */
function checkEquipmentCompatibility(userEquipment, contentEquipment) {
  if (!contentEquipment || contentEquipment.length === 0) return 1.0; // No equipment needed
  if (!userEquipment || userEquipment.length === 0) return 0; // User has no equipment
  
  // Check if user has required equipment
  const hasAllEquipment = contentEquipment.every(item => 
    userEquipment.some(userItem => 
      userItem.toLowerCase().includes(item.toLowerCase()) || 
      item.toLowerCase().includes(userItem.toLowerCase())
    )
  );
  
  if (hasAllEquipment) return 1.0;
  
  // Partial equipment match
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
  
  // Add relevance indicators
  if (result.finalRelevanceScore > 0.8) {
    formatted += ` ⭐ (Highly Recommended)`;
  } else if (result.finalRelevanceScore > 0.6) {
    formatted += ` 👍 (Good Match)`;
  }
  
  formatted += `\n${result.content}`;
  
  // Add personalized notes
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
  
  // Experience level notes
  if (user.experience === 'beginner' && metadata.difficulty === 'intermediate') {
    notes.push("This might be challenging for your current level - consider starting with easier variations");
  } else if (user.experience === 'advanced' && metadata.difficulty === 'beginner') {
    notes.push("You can probably increase intensity or add variations to make this more challenging");
  }
  
  // Equipment notes
  if (metadata.equipment && metadata.equipment.length > 0) {
    const hasEquipment = user.availableEquipment && 
      metadata.equipment.every(item => user.availableEquipment.includes(item));
    if (!hasEquipment) {
      notes.push("Consider equipment alternatives or modifications based on what you have available");
    }
  }
  
  // Goal alignment notes
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
 * Create user-specific knowledge embeddings for common queries
 */
export async function createPersonalizedKnowledgeBase(userId) {
  try {
    const user = await User.findOne({ firebaseUid: userId }).lean();
    if (!user) return false;
    
    // Generate personalized content based on user profile
    const personalizedContent = generatePersonalizedContent(user);
    
    // Create embeddings for personalized content
    for (const content of personalizedContent) {
      const embedding = await embeddings.embedQuery(content.content);
      
      await FitnessEmbedding.findOneAndUpdate(
        { 
          'metadata.userId': userId,
          'metadata.title': content.title 
        },
        {
          content: content.content,
          embedding: embedding,
          metadata: {
            ...content.metadata,
            userId: userId,
            personalized: true,
            created: new Date()
          },
          isActive: true
        },
        { upsert: true, new: true }
      );
    }
    
    console.log(`✅ Created personalized knowledge base for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error("Error creating personalized knowledge base:", error);
    return false;
  }
}

/**
 * Generate personalized content based on user profile
 */
function generatePersonalizedContent(user) {
  const content = [];
  
  // Personalized workout recommendations
  if (user.fitnessGoal && user.experience && user.availableEquipment) {
    content.push({
      content: `Personalized ${user.fitnessGoal} workout plan for ${user.experience} level using ${user.availableEquipment.join(', ')}. Focus on progressive overload, proper form, and consistency. Start with 3 sessions per week and gradually increase intensity.`,
      title: `Personal ${user.fitnessGoal} Plan`,
      metadata: {
        type: 'workout',
        plan: user.fitnessGoal.toLowerCase().replace(' ', '-'),
        difficulty: user.experience.toLowerCase(),
        equipment: user.availableEquipment,
        tags: ['personalized', user.fitnessGoal.toLowerCase()]
      }
    });
  }
  
  // Personalized nutrition advice
  if (user.fitnessGoal && user.dietaryPreference) {
    content.push({
      content: `Personalized ${user.dietaryPreference} nutrition plan for ${user.fitnessGoal}. Focus on whole foods, proper macronutrient balance, and meal timing. Include adequate protein, complex carbohydrates, and healthy fats.`,
      title: `Personal ${user.dietaryPreference} Nutrition`,
      metadata: {
        type: 'nutrition',
        plan: user.fitnessGoal.toLowerCase().replace(' ', '-'),
        tags: ['personalized', user.dietaryPreference.toLowerCase(), 'nutrition']
      }
    });
  }
  
  return content;
}

/**
 * Search with hybrid approach: vector + traditional search
 */
export async function hybridSearch(query, userId, limit = 5) {
  try {
    // Perform both vector and text search
    const [vectorResults, textResults] = await Promise.all([
      personalizedVectorSearch(query, userId, Math.ceil(limit * 0.7)),
      traditionalSearch(query, userId, Math.ceil(limit * 0.5))
    ]);
    
    // Combine and deduplicate results
    const combinedResults = mergeSearchResults(vectorResults, textResults);
    
    // Return top results
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
  
  // Add vector results first (higher priority)
  for (const result of vectorResults) {
    const id = result._id?.toString() || result.metadata?.title;
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push({ ...result, source: 'vector' });
    }
  }
  
  // Add unique text results
  for (const result of textResults) {
    const id = result._id?.toString() || result.metadata?.title;
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push({ ...result, source: 'text' });
    }
  }
  
  return merged;
}

