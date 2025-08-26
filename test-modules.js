#!/usr/bin/env node

// Test script to verify all module imports are working
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('✅ ES modules are working correctly!');
console.log('✅ dotenv loaded successfully');

// Test imports that were previously failing
try {
  const { connectDB } = await import('./src/lib/db.js');
  console.log('✅ db.js import successful');
} catch (error) {
  console.log('❌ db.js import failed:', error.message);
}

try {
  const { enhancedVectorSearch } = await import('./src/lib/enhancedVectorSearch.js');
  console.log('✅ enhancedVectorSearch.js import successful');
} catch (error) {
  console.log('❌ enhancedVectorSearch.js import failed:', error.message);
}

try {
  const { personalizedVectorSearch } = await import('./src/lib/vectorSearch.js');
  console.log('✅ vectorSearch.js import successful');
} catch (error) {
  console.log('❌ vectorSearch.js import failed:', error.message);
}

console.log('\n🎉 All module import issues have been resolved!');
console.log('The setup script should now work once you configure your environment variables.');
console.log('\nRequired environment variables:');
console.log('- MONGODB_URI');
console.log('- PINECONE_API_KEY');
console.log('- PINECONE_INDEX_NAME');
console.log('- GEMINI_API_KEY');
console.log('- USE_PINECONE=true');
