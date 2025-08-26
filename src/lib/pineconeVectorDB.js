// lib/pineconeVectorDB.js - High-performance vector database for AI chatbot
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

class PineconeVectorDB {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    this.index = this.pinecone.index(process.env.PINECONE_INDEX_NAME || 'coachlix-fitness');
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001",
    });
  }

  /**
   * High-performance vector search with metadata filtering
   */
  async search(query, userId, filters = {}, limit = 10) {
    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Build metadata filters for Pinecone
      const metadataFilter = this.buildMetadataFilter(filters, userId);
      
      // Perform vector search
      const searchResponse = await this.index.query({
        vector: queryEmbedding,
        topK: limit * 2, // Get more results for re-ranking
        includeMetadata: true,
        filter: metadataFilter,
      });

      // Re-rank results based on user context
      const rerankedResults = await this.reRankResults(searchResponse.matches, userId, query);
      
      return rerankedResults.slice(0, limit);
      
    } catch (error) {
      console.error('Pinecone search error:', error);
      return [];
    }
  }

  /**
   * Build metadata filter for Pinecone
   */
  buildMetadataFilter(filters, userId) {
    const filter = {};
    
    // User-specific filtering
    if (userId) {
      filter.userId = { $in: [userId, 'global'] }; // Include global content
    }
    
    // Plan-based filtering
    if (filters.plan) {
      filter.plan = { $in: Array.isArray(filters.plan) ? filters.plan : [filters.plan] };
    }
    
    // Type-based filtering
    if (filters.type) {
      filter.type = { $in: Array.isArray(filters.type) ? filters.type : [filters.type] };
    }
    
    // Difficulty filtering
    if (filters.difficulty) {
      filter.difficulty = { $in: Array.isArray(filters.difficulty) ? filters.difficulty : [filters.difficulty] };
    }
    
    // Equipment filtering
    if (filters.equipment) {
      filter.equipment = { $in: filters.equipment };
    }
    
    // Active content only
    filter.isActive = { $eq: true };
    
    return filter;
  }

  /**
   * Re-rank results based on user context and preferences
   */
  async reRankResults(matches, userId, query) {
    if (!userId) return matches;
    
    try {
      // Get user profile for personalization
      const { User } = await import('../models/userProfileModel');
      const user = await User.findOne({ firebaseUid: userId })
        .select('fitnessGoal experience availableEquipment dietaryPreference')
        .lean();
      
      if (!user) return matches;
      
      return matches.map(match => {
        let relevanceScore = match.score || 0.5;
        
        // Boost based on fitness goal alignment
        if (user.fitnessGoal && match.metadata?.plan) {
          const goalMatch = this.checkGoalAlignment(user.fitnessGoal, match.metadata.plan);
          relevanceScore += goalMatch * 0.3;
        }
        
        // Boost based on experience level
        if (user.experience && match.metadata?.difficulty) {
          const expMatch = this.checkExperienceMatch(user.experience, match.metadata.difficulty);
          relevanceScore += expMatch * 0.2;
        }
        
        // Boost for equipment compatibility
        if (user.availableEquipment && match.metadata?.equipment) {
          const equipmentMatch = this.checkEquipmentCompatibility(user.availableEquipment, match.metadata.equipment);
          relevanceScore += equipmentMatch * 0.15;
        }
        
        // Query-specific boosts
        const queryLower = query.toLowerCase();
        if (queryLower.includes('beginner') && match.metadata?.difficulty === 'beginner') {
          relevanceScore += 0.2;
        }
        if (queryLower.includes('quick') && match.metadata?.tags?.includes('quick')) {
          relevanceScore += 0.15;
        }
        
        return {
          ...match,
          finalRelevanceScore: Math.min(relevanceScore, 1.0)
        };
      }).sort((a, b) => b.finalRelevanceScore - a.finalRelevanceScore);
      
    } catch (error) {
      console.error('Error re-ranking results:', error);
      return matches;
    }
  }

  /**
   * Check goal alignment between user and content
   */
  checkGoalAlignment(userGoal, contentPlan) {
    if (!userGoal || !contentPlan) return 0;
    
    const goalLower = userGoal.toLowerCase();
    const planLower = contentPlan.toLowerCase();
    
    if (goalLower.includes('weight loss') && planLower.includes('weight-loss')) return 1.0;
    if (goalLower.includes('muscle gain') && planLower.includes('muscle-gain')) return 1.0;
    if (goalLower.includes('badminton') && planLower.includes('badminton')) return 1.0;
    if (goalLower.includes('strength') && planLower.includes('strength')) return 1.0;
    
    return 0;
  }

  /**
   * Check experience level compatibility
   */
  checkExperienceMatch(userExp, contentDifficulty) {
    if (!userExp || !contentDifficulty) return 0;
    
    const expLower = userExp.toLowerCase();
    const diffLower = contentDifficulty.toLowerCase();
    
    if (expLower === diffLower) return 1.0;
    if (expLower === 'beginner' && diffLower === 'easy') return 1.0;
    if (expLower === 'intermediate' && (diffLower === 'beginner' || diffLower === 'easy')) return 0.7;
    if (expLower === 'advanced' && diffLower === 'intermediate') return 0.8;
    
    return 0;
  }

  /**
   * Check equipment compatibility
   */
  checkEquipmentCompatibility(userEquipment, contentEquipment) {
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
   * Upsert content to vector database
   */
  async upsertContent(content, metadata) {
    try {
      const embedding = await this.embeddings.embedQuery(content);
      
      await this.index.upsert([{
        id: metadata.id || `content_${Date.now()}`,
        values: embedding,
        metadata: {
          content,
          ...metadata,
          createdAt: new Date().toISOString()
        }
      }]);
      
      console.log(`✅ Content upserted to Pinecone: ${metadata.title}`);
      return true;
      
    } catch (error) {
      console.error('Error upserting content to Pinecone:', error);
      return false;
    }
  }

  /**
   * Batch upsert content for better performance
   */
  async batchUpsert(contents) {
    try {
      const vectors = [];
      
      for (const item of contents) {
        const embedding = await this.embeddings.embedQuery(item.content);
        vectors.push({
          id: item.id || `content_${Date.now()}_${Math.random()}`,
          values: embedding,
          metadata: {
            content: item.content,
            ...item.metadata,
            createdAt: new Date().toISOString()
          }
        });
      }
      
      await this.index.upsert(vectors);
      console.log(`✅ Batch upserted ${vectors.length} items to Pinecone`);
      return true;
      
    } catch (error) {
      console.error('Error batch upserting to Pinecone:', error);
      return false;
    }
  }

  /**
   * Delete content from vector database
   */
  async deleteContent(id) {
    try {
      await this.index.deleteOne(id);
      console.log(`✅ Content deleted from Pinecone: ${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting content from Pinecone:', error);
      return false;
    }
  }

  /**
   * Get index statistics
   */
  async getStats() {
    try {
      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('Error getting Pinecone stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const pineconeDB = new PineconeVectorDB();

export default pineconeDB;
