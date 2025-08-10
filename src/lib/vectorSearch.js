// lib/vectorSearch.js
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { connectDB } from "./db";
import mongoose from "mongoose";

// Initialize embeddings with Gemini
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001", // Gemini embedding model
});

/**
 * Creates a MongoDB Atlas Vector Search instance
 * @param {string} collectionName - MongoDB collection name for vector storage
 * @param {string} indexName - Vector search index name
 * @returns {MongoDBAtlasVectorSearch} Vector search instance
 */
export async function createVectorStore(
  collectionName = "fitness_embeddings", 
  indexName = "fitness_vector_index"
) {
  try {
    await connectDB();
    
    const collection = mongoose.connection.db.collection(collectionName);
    
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: indexName,
      textKey: "content", // Field containing the text content
      embeddingKey: "embedding", // Field containing the embedding vector
    });

    return vectorStore;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw new Error("Failed to initialize vector search");
  }
}

/**
 * Searches for relevant fitness content based on user query
 * @param {string} query - User's query
 * @param {number} k - Number of results to return
 * @returns {Array} Array of relevant documents
 */
export async function searchFitnessContent(query, k = 5) {
  try {
    const vectorStore = await createVectorStore();
    const results = await vectorStore.similaritySearch(query, k);
    
    return results.map(doc => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score: doc.score || 0
    }));
  } catch (error) {
    console.error("Error searching fitness content:", error);
    return []; // Return empty array to not break the chat
  }
}

/**
 * Creates embeddings for workout/diet documents and stores them
 * @param {Array} documents - Array of workout/diet documents
 * @returns {boolean} Success status
 */
export async function indexFitnessDocuments(documents) {
  try {
    const vectorStore = await createVectorStore();
    
    // Format documents for vector storage
    const formattedDocs = documents.map(doc => ({
      pageContent: doc.content,
      metadata: {
        type: doc.type, // 'workout', 'diet', 'exercise', etc.
        title: doc.title,
        plan: doc.plan, // fitness plan category
        difficulty: doc.difficulty,
        duration: doc.duration,
        equipment: doc.equipment,
        targetMuscles: doc.targetMuscles,
        calories: doc.calories,
        created: new Date(),
        ...doc.metadata
      }
    }));

    await vectorStore.addDocuments(formattedDocs);
    console.log(`✅ Indexed ${formattedDocs.length} fitness documents`);
    return true;
  } catch (error) {
    console.error("Error indexing documents:", error);
    return false;
  }
}

/**
 * Formats vector search results for LLM context
 * @param {Array} searchResults - Results from vector search
 * @param {number} maxLength - Maximum character length for context
 * @returns {string} Formatted context string
 */
export function formatSearchResultsForContext(searchResults, maxLength = 1500) {
  if (!searchResults || searchResults.length === 0) {
    return "";
  }

  let context = "\n\nRelevant fitness information from database:\n";
  let currentLength = context.length;

  for (const result of searchResults) {
    const formattedResult = `\n--- ${result.metadata?.title || 'Fitness Content'} ---\n${result.content}\n`;
    
    if (currentLength + formattedResult.length > maxLength) {
      break;
    }
    
    context += formattedResult;
    currentLength += formattedResult.length;
  }

  return context.length > 100 ? context : "";
}

/**
 * Sample function to populate your vector database with fitness content
 * Call this once to initialize your database with workout/diet plans
 */
export async function initializeFitnessDatabase() {
  const sampleDocuments = [
    {
      content: "Full Body Strength Training Workout: 3 sets of squats (12 reps), deadlifts (10 reps), bench press (10 reps), rows (12 reps), overhead press (8 reps). Rest 60-90 seconds between sets. Focus on proper form over heavy weight.",
      type: "workout",
      title: "Full Body Strength Training",
      plan: "strength",
      difficulty: "intermediate",
      duration: "45-60 minutes",
      equipment: "barbell, dumbbells, bench",
      targetMuscles: "full body",
      metadata: {
        category: "strength",
        restTime: "60-90 seconds"
      }
    },
    {
      content: "Weight Loss Cardio Circuit: 5 rounds of 1 minute jumping jacks, 1 minute burpees, 1 minute mountain climbers, 1 minute high knees, 30 seconds rest. Total time: 22.5 minutes. Burns approximately 250-300 calories.",
      type: "workout",
      title: "Weight Loss Cardio Circuit",
      plan: "weight-loss",
      difficulty: "beginner",
      duration: "25 minutes",
      equipment: "none",
      targetMuscles: "full body cardio",
      calories: "250-300",
      metadata: {
        category: "cardio",
        intensity: "high"
      }
    },
    {
      content: "Badminton Agility Training: Ladder drills (2 sets x 30 seconds), cone shuttles (3 sets x 45 seconds), shadow badminton (3 sets x 1 minute), jumping lunges (2 sets x 20 reps). Focus on quick direction changes and explosive movements.",
      type: "workout",
      title: "Badminton Agility Training",
      plan: "badminton",
      difficulty: "intermediate",
      duration: "30 minutes",
      equipment: "agility ladder, cones",
      targetMuscles: "legs, core",
      metadata: {
        category: "sport-specific",
        sport: "badminton"
      }
    },
    {
      content: "High Protein Muscle Building Diet: Breakfast - Greek yogurt with berries and nuts (25g protein). Lunch - Grilled chicken breast with quinoa and vegetables (35g protein). Dinner - Salmon with sweet potato and broccoli (30g protein). Snacks - Protein shake and almonds (25g protein). Total: ~115g protein.",
      type: "diet",
      title: "High Protein Muscle Building Diet",
      plan: "muscle-gain",
      difficulty: "easy",
      duration: "daily",
      equipment: "none",
      calories: "2200-2500",
      metadata: {
        category: "nutrition",
        protein: "115g",
        meals: 4
      }
    },
    {
      content: "Weight Loss Meal Plan: Focus on lean proteins, vegetables, and complex carbs. Breakfast - Oatmeal with berries (300 cal). Lunch - Grilled chicken salad (400 cal). Dinner - Baked fish with roasted vegetables (450 cal). Snacks - Apple with almond butter (200 cal). Total: ~1350 calories with balanced macros.",
      type: "diet",
      title: "Weight Loss Meal Plan",
      plan: "weight-loss",
      difficulty: "easy",
      duration: "daily",
      equipment: "none",
      calories: "1350",
      metadata: {
        category: "nutrition",
        goal: "weight-loss",
        meals: 4
      }
    }
  ];

  try {
    const success = await indexFitnessDocuments(sampleDocuments);
    if (success) {
      console.log("✅ Fitness database initialized successfully");
    } else {
      console.error("❌ Failed to initialize fitness database");
    }
    return success;
  } catch (error) {
    console.error("Error initializing fitness database:", error);
    return false;
  }
}