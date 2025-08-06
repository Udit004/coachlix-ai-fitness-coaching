// scripts/cleanup-old-chats.js
// Run this script with: node scripts/cleanup-old-chats.js
// Or set it up as a cron job to run daily

const { MongoClient } = require('mongodb');

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string';
const DB_NAME = process.env.DB_NAME || 'your-database-name';

async function cleanupOldChats() {
  let client;
  
  try {
    console.log('🧹 Starting chat cleanup process...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('chat_sessions');
    
    // Calculate the cutoff date (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log(`🗓️ Deleting chats older than: ${sevenDaysAgo.toISOString()}`);
    
    // Find and count old chats first
    const oldChatsCount = await collection.countDocuments({
      createdAt: { $lt: sevenDaysAgo }
    });
    
    console.log(`📊 Found ${oldChatsCount} old chats to delete`);
    
    if (oldChatsCount === 0) {
      console.log('✨ No old chats to cleanup!');
      return;
    }
    
    // Delete old chats
    const result = await collection.deleteMany({
      createdAt: { $lt: sevenDaysAgo }
    });
    
    console.log(`🗑️ Successfully deleted ${result.deletedCount} old chat sessions`);
    
    // Get remaining chat statistics
    const totalChats = await collection.countDocuments({});
    const recentChats = await collection.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    console.log(`📈 Database statistics:`);
    console.log(`   - Total chats remaining: ${totalChats}`);
    console.log(`   - Recent chats (last 7 days): ${recentChats}`);
    
    // Get storage information
    const stats = await db.stats();
    console.log(`💾 Storage info:`);
    console.log(`   - Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Index size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 MongoDB connection closed');
    }
  }
}

// Advanced cleanup with user-specific limits
async function cleanupWithUserLimits() {
  let client;
  
  try {
    console.log('🧹 Starting advanced chat cleanup with user limits...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection('chat_sessions');
    
    // Get all users with their chat counts
    const userStats = await collection.aggregate([
      {
        $group: {
          _id: '$userId',
          chatCount: { $sum: 1 },
          oldestChat: { $min: '$createdAt' },
          newestChat: { $max: '$updatedAt' }
        }
      }
    ]).toArray();
    
    console.log(`👥 Found ${userStats.length} users with chat history`);
    
    let totalDeleted = 0;
    const MAX_CHATS_PER_USER = 50; // Keep max 50 chats per user
    
    for (const userStat of userStats) {
      if (userStat.chatCount > MAX_CHATS_PER_USER) {
        // Keep only the most recent chats for this user
        const userChats = await collection
          .find({ userId: userStat._id })
          .sort({ updatedAt: -1 })
          .limit(MAX_CHATS_PER_USER)
          .toArray();
        
        const keepIds = userChats.map(chat => chat._id);
        
        // Delete old chats for this user
        const deleteResult = await collection.deleteMany({
          userId: userStat._id,
          _id: { $nin: keepIds }
        });
        
        totalDeleted += deleteResult.deletedCount;
        
        console.log(`🧹 User ${userStat._id}: deleted ${deleteResult.deletedCount} old chats`);
      }
    }
    
    console.log(`🗑️ Total chats deleted: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Error during advanced cleanup:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'basic';
  
  try {
    if (mode === 'advanced') {
      await cleanupWithUserLimits();
    } else {
      await cleanupOldChats();
    }
    
    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  cleanupOldChats,
  cleanupWithUserLimits
};