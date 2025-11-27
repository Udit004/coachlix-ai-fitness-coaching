// Quick Redis Connection Test for Next.js App
// Run this to verify Redis is working in your Next.js app

console.log('🔍 Checking Redis Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not Set');
console.log('  REDIS_DB_NAME:', process.env.REDIS_DB_NAME || 'coachlix (default)');
console.log('  DISABLE_REDIS:', process.env.DISABLE_REDIS || 'false (default)');
console.log('');

// Import redis after logging env vars
import('./src/lib/redis.js').then(({ default: redis }) => {
  console.log('Redis Client Status:');
  console.log('  Client:', redis ? '✅ Initialized' : '❌ Not Initialized');
  
  if (redis) {
    console.log('\n✅ Redis is configured and ready!');
    console.log('📝 Note: Connection will be established when Next.js app starts.');
  } else {
    console.log('\n⚠️ Redis is not configured.');
    console.log('💡 This is okay - the app will work without caching.');
  }
  
  console.log('\n🎯 To test Redis in action:');
  console.log('   1. Start your Next.js app: npm run dev');
  console.log('   2. Open the app in browser');
  console.log('   3. Send a chat message');
  console.log('   4. Check console logs for cache HIT/MISS');
  
  process.exit(0);
}).catch(err => {
  console.error('Error loading Redis:', err.message);
  process.exit(1);
});
