// scripts/setupEmbeddings.js - Initialize Vector Database with Fitness Content
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB } from "../lib/db.js";
import FitnessEmbedding from "../models/FitnessEmbedding.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

// Comprehensive fitness content for different plans
const fitnessDocuments = [
  // GENERAL FITNESS
  {
    content: "Full Body Beginner Workout: Start with bodyweight exercises. Do 3 sets of: 10 squats, 8 push-ups (or knee push-ups), 10 lunges per leg, 30-second plank, 10 glute bridges. Rest 60 seconds between sets. Focus on proper form over speed.",
    metadata: {
      type: "workout",
      title: "Full Body Beginner Workout",
      plan: "general",
      difficulty: "beginner",
      duration: "20-30 minutes",
      equipment: ["none"],
      targetMuscles: ["full body"],
      tags: ["beginner", "bodyweight", "full-body", "home-workout"]
    }
  },
  {
    content: "Balanced Daily Nutrition Plan: Aim for 5-6 small meals. Include lean protein with each meal, complex carbohydrates for energy, healthy fats for hormone production, and plenty of vegetables for micronutrients. Stay hydrated with 8-10 glasses of water daily.",
    metadata: {
      type: "nutrition",
      title: "Balanced Daily Nutrition Guide",
      plan: "general",
      difficulty: "beginner",
      duration: "daily",
      equipment: ["none"],
      tags: ["nutrition", "balanced-diet", "healthy-eating", "meal-planning"]
    }
  },

  // BADMINTON SPECIFIC
  {
    content: "Badminton Footwork Drills: Shadow badminton for 2 minutes, focusing on proper stance and movement. Practice split-step timing with 20 repetitions. Do four-corner movement drill for 3 sets of 45 seconds. End with ladder drills for agility - 3 sets of in-in-out-out pattern.",
    metadata: {
      type: "workout",
      title: "Badminton Footwork Training",
      plan: "badminton",
      difficulty: "intermediate",
      duration: "25 minutes",
      equipment: ["agility ladder", "cones"],
      targetMuscles: ["legs", "core", "cardiovascular"],
      tags: ["badminton", "footwork", "agility", "sport-specific", "movement"]
    }
  },
  {
    content: "Badminton Serve Technique: Start with feet shoulder-width apart, left foot forward (for right-handed players). Hold racket with relaxed grip. Toss shuttlecock slightly forward and up. Contact point should be at full arm extension. Follow through toward target area. Practice 20 serves focusing on consistency over power.",
    metadata: {
      type: "technique",
      title: "Badminton Serve Technique",
      plan: "badminton",
      difficulty: "beginner",
      duration: "15 minutes",
      equipment: ["badminton racket", "shuttlecocks"],
      targetMuscles: ["shoulders", "core"],
      tags: ["badminton", "serve", "technique", "fundamentals"]
    }
  },

  // WEIGHT LOSS
  {
    content: "HIIT Weight Loss Circuit: 4 rounds of 30 seconds work, 10 seconds rest: Burpees, Jump squats, Mountain climbers, Push-ups, High knees, Plank jacks. Rest 60 seconds between rounds. Burns 200-300 calories in 20 minutes. Modify intensity as needed.",
    metadata: {
      type: "workout",
      title: "HIIT Weight Loss Circuit",
      plan: "weight-loss",
      difficulty: "intermediate",
      duration: "20 minutes",
      equipment: ["none"],
      targetMuscles: ["full body"],
      calories: "200-300",
      tags: ["HIIT", "weight-loss", "cardio", "fat-burning", "high-intensity"]
    }
  },
  {
    content: "Weight Loss Meal Prep: Prepare 4 meals at once. Lean protein (chicken, fish, tofu), complex carbs (quinoa, sweet potato), and vegetables. Portion control: palm-sized protein, fist-sized carbs, thumb-sized fats. Season with herbs and spices instead of high-calorie sauces.",
    metadata: {
      type: "nutrition",
      title: "Weight Loss Meal Prep Guide",
      plan: "weight-loss",
      difficulty: "easy",
      duration: "weekly prep",
      equipment: ["none"],
      calories: "400-500 per meal",
      tags: ["weight-loss", "meal-prep", "portion-control", "healthy-cooking"]
    }
  },

  // MUSCLE GAIN
  {
    content: "Muscle Building Upper Body: 4 sets of Bench Press (8-10 reps), 3 sets of Bent-over Rows (10-12 reps), 3 sets of Overhead Press (8-10 reps), 3 sets of Pull-ups or Lat Pulldowns (8-12 reps), 2 sets of Bicep Curls (12-15 reps), 2 sets of Tricep Dips (10-15 reps). Rest 2-3 minutes between compound exercises.",
    metadata: {
      type: "workout",
      title: "Upper Body Muscle Building",
      plan: "muscle-gain",
      difficulty: "intermediate",
      duration: "60-75 minutes",
      equipment: ["barbell", "dumbbells", "pull-up bar", "bench"],
      targetMuscles: ["chest", "back", "shoulders", "arms"],
      tags: ["muscle-gain", "upper-body", "strength", "hypertrophy"]
    }
  },
  {
    content: "High Protein Muscle Gain Diet: Target 1.6-2.2g protein per kg body weight. Include: Breakfast - Greek yogurt with nuts (25g protein), Lunch - Chicken and rice (40g protein), Pre-workout - Banana with peanut butter (8g protein), Post-workout - Protein shake (25g protein), Dinner - Salmon with quinoa (35g protein). Total: ~130g protein for 70kg person.",
    metadata: {
      type: "nutrition",
      title: "High Protein Muscle Gain Diet",
      plan: "muscle-gain",
      difficulty: "intermediate",
      duration: "daily",
      equipment: ["none"],
      calories: "2500-3000",
      tags: ["muscle-gain", "high-protein", "bulking", "nutrition-timing"]
    }
  },

  // STRENGTH TRAINING
  {
    content: "Strength Training Fundamentals: Master the big 4 compound movements - Squat, Deadlift, Bench Press, Overhead Press. Start with bodyweight or light weights. Focus on full range of motion, controlled tempo (2 seconds down, 1 second up), and proper breathing. Progressive overload by adding 2.5-5kg weekly.",
    metadata: {
      type: "technique",
      title: "Strength Training Fundamentals",
      plan: "strength",
      difficulty: "beginner",
      duration: "ongoing",
      equipment: ["barbell", "weights"],
      targetMuscles: ["full body"],
      tags: ["strength", "compound-movements", "fundamentals", "progressive-overload"]
    }
  },

  // CARDIO FOCUSED
  {
    content: "Beginner Cardio Progression: Week 1-2: 20 minutes walking at moderate pace. Week 3-4: Alternate 1 minute jogging, 2 minutes walking for 20 minutes. Week 5-6: 2 minutes jogging, 1 minute walking for 25 minutes. Week 7-8: Continuous 20-minute jog. Listen to your body and adjust pace as needed.",
    metadata: {
      type: "workout",
      title: "Beginner Cardio Progression",
      plan: "cardio",
      difficulty: "beginner",
      duration: "20-25 minutes",
      equipment: ["none"],
      targetMuscles: ["cardiovascular"],
      tags: ["cardio", "beginner", "progression", "running", "endurance"]
    }
  },

  // QUICK WORKOUTS
  {
    content: "7-Minute Quick Workout: 30 seconds each exercise, 10 seconds rest: Jumping jacks, Wall sits, Push-ups, Abdominal crunches, Step-ups, Squats, Tricep dips, Plank, High knees, Lunges, Push-up rotation, Side plank (each side). High intensity, maximum effort for each exercise.",
    metadata: {
      type: "workout",
      title: "7-Minute Express Workout",
      plan: "quick",
      difficulty: "intermediate",
      duration: "7 minutes",
      equipment: ["chair", "wall"],
      targetMuscles: ["full body"],
      calories: "50-80",
      tags: ["quick", "HIIT", "time-efficient", "bodyweight", "express"]
    }
  },

  // SPORTS TRAINING
  {
    content: "Athletic Performance Training: Combine strength, power, and agility. Start with dynamic warm-up (5 min), power exercises like box jumps and medicine ball throws (15 min), strength training with compound movements (25 min), agility ladder work (10 min), cool-down and stretching (5 min).",
    metadata: {
      type: "workout",
      title: "Athletic Performance Training",
      plan: "sports",
      difficulty: "advanced",
      duration: "60 minutes",
      equipment: ["plyometric box", "medicine ball", "agility ladder", "weights"],
      targetMuscles: ["full body", "power", "agility"],
      tags: ["sports", "athletic-performance", "power", "agility", "competitive"]
    }
  }
];

/**
 * Function to populate the vector database with fitness content
 */
export async function populateVectorDatabase() {
  try {
    console.log("🚀 Starting vector database population...");
    
    await connectDB();
    
    // Initialize embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001",
    });

    let successCount = 0;
    let errorCount = 0;

    for (const doc of fitnessDocuments) {
      try {
        // Generate embedding for the content
        const embeddingVector = await embeddings.embedQuery(doc.content);
        
        // Create or update the document
        await FitnessEmbedding.findOneAndUpdate(
          { 
            'metadata.title': doc.metadata.title,
            'metadata.plan': doc.metadata.plan 
          },
          {
            content: doc.content,
            embedding: embeddingVector,
            metadata: doc.metadata,
            isActive: true
          },
          { 
            upsert: true, 
            new: true 
          }
        );

        successCount++;
        console.log(`✅ Processed: ${doc.metadata.title}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${doc.metadata.title}:`, error.message);
      }
    }

    console.log(`🎉 Vector database population complete!`);
    console.log(`✅ Successfully processed: ${successCount} documents`);
    console.log(`❌ Errors: ${errorCount} documents`);
    
    return { success: successCount, errors: errorCount };
    
  } catch (error) {
    console.error("Error populating vector database:", error);
    throw error;
  }
}

// Export the schema
const FitnessEmbedding = mongoose.models.FitnessEmbedding || mongoose.model('FitnessEmbedding', FitnessEmbeddingSchema);

export default FitnessEmbedding;