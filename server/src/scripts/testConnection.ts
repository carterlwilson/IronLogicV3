import { connectDB, getConnectionStatus, getDatabaseStats } from '../config/database';
import mongoose from 'mongoose';

const testDatabaseConnection = async () => {
  console.log('🧪 Testing MongoDB connection...');
  
  try {
    // Test connection
    await connectDB();
    
    // Get connection status
    const status = getConnectionStatus();
    console.log('📊 Connection Status:', status);
    
    // Get database stats if connected
    if (status.state === 'connected') {
      try {
        const stats = await getDatabaseStats();
        console.log('📈 Database Stats:', stats);
      } catch (error) {
        console.log('⚠️  Could not get database stats:', error);
      }
    }
    
    // Test a simple operation
    console.log('🔬 Testing database operations...');
    
    // Create a test collection
    const testCollection = mongoose.connection.db?.collection('test');
    
    // Insert a test document
    const insertResult = await testCollection?.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'INFRA-002 test'
    });
    
    console.log('✅ Test document inserted:', insertResult?.insertedId);
    
    // Find the document
    const findResult = await testCollection?.findOne({ test: true });
    console.log('✅ Test document found:', findResult);
    
    // Clean up
    await testCollection?.deleteOne({ test: true });
    console.log('🧹 Test document cleaned up');
    
    console.log('🎉 Database connection test successful!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
  }
};

// Run the test if called directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection };