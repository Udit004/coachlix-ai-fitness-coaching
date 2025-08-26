#!/usr/bin/env node

// scripts/setupPinecone.js - Setup and migration script for Pinecone vector database
import dotenv from 'dotenv';

// Load environment variables from .env.local BEFORE importing other modules
dotenv.config({ path: '.env.local' });

import { migrateToPinecone, getSearchMetrics } from '../src/lib/enhancedVectorSearch.js';

async function setupPinecone() {
  console.log('🚀 Setting up Pinecone Vector Database for Coachlix AI...\n');

  // Check environment variables
  const requiredEnvVars = ['PINECONE_API_KEY', 'PINECONE_INDEX_NAME', 'GEMINI_API_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n📝 Please add these to your .env file:');
    console.log('PINECONE_API_KEY=your_pinecone_api_key');
    console.log('PINECONE_INDEX_NAME=coachlix-fitness');
    console.log('USE_PINECONE=true');
    console.log('\n🔗 Get your Pinecone API key from: https://app.pinecone.io/');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');
  console.log(`📊 Index name: ${process.env.PINECONE_INDEX_NAME}`);
  console.log(`🔑 API key: ${process.env.PINECONE_API_KEY.substring(0, 8)}...`);

  try {
    // Get current search metrics
    console.log('\n📈 Getting current search metrics...');
    const metrics = await getSearchMetrics();
    
    console.log('Current setup:');
    console.log(`   - MongoDB embeddings: ${metrics.mongoDBStats?.totalEmbeddings || 0}`);
    console.log(`   - Pinecone enabled: ${metrics.pineconeEnabled}`);
    console.log(`   - Cache entries: ${metrics.cacheStats?.size || 0}`);

    if (metrics.pineconeEnabled) {
      console.log('\n🔄 Pinecone is already configured!');
      
      if (metrics.pineconeStats) {
        console.log('Pinecone index stats:');
        console.log(`   - Total vectors: ${metrics.pineconeStats.totalVectorCount || 0}`);
        console.log(`   - Index dimension: ${metrics.pineconeStats.dimension || 'N/A'}`);
      }
    }

    // Ask user if they want to migrate
    console.log('\n🤔 Would you like to migrate existing MongoDB embeddings to Pinecone?');
    console.log('This will improve search performance significantly.');
    
    // For now, auto-migrate if Pinecone is enabled
    if (process.env.USE_PINECONE === 'true') {
      console.log('\n🔄 Starting migration to Pinecone...');
      
      const success = await migrateToPinecone();
      
      if (success) {
        console.log('\n✅ Migration completed successfully!');
        console.log('🎉 Your AI chatbot will now use Pinecone for faster vector search.');
        
        // Get updated metrics
        const updatedMetrics = await getSearchMetrics();
        console.log('\n📊 Updated metrics:');
        if (updatedMetrics.pineconeStats) {
          console.log(`   - Pinecone vectors: ${updatedMetrics.pineconeStats.totalVectorCount || 0}`);
        }
      } else {
        console.log('\n❌ Migration failed. Check the logs above for details.');
        console.log('💡 You can still use MongoDB vector search as a fallback.');
      }
    }

    console.log('\n🎯 Setup complete! Your AI chatbot is ready with enhanced vector search.');
    console.log('\n📝 Next steps:');
    console.log('   1. Test your chatbot to see improved performance');
    console.log('   2. Monitor search metrics in your application logs');
    console.log('   3. Consider adding more fitness content to improve search results');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your Pinecone API key is correct');
    console.log('   2. Ensure your Pinecone index exists and is accessible');
    console.log('   3. Verify your MongoDB connection is working');
    process.exit(1);
  }
}

// Run the setup
setupPinecone().catch(console.error);
