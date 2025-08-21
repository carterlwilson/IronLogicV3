import mongoose from 'mongoose';
import { connectDB } from '../config/database';

/**
 * Database indexes script for IronLogic3
 * 
 * This script creates essential database indexes to optimize query performance
 * Based on the planned schema from implementation.md
 */

const createIndexes = async () => {
  console.log('🏗️  Creating database indexes...');

  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not established');
    }

    // User collection indexes
    console.log('📋 Creating User indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ userType: 1 });
    await db.collection('users').createIndex({ gymId: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ createdAt: 1 });
    
    // Gym collection indexes
    console.log('🏃 Creating Gym indexes...');
    await db.collection('gyms').createIndex({ ownerId: 1 });
    await db.collection('gyms').createIndex({ name: 1 });
    await db.collection('gyms').createIndex({ isActive: 1 });
    await db.collection('gyms').createIndex({ 'locations.locationId': 1 });

    // Activity Templates collection indexes
    console.log('🏋️  Creating ActivityTemplate indexes...');
    await db.collection('activitytemplates').createIndex({ gymId: 1 });
    await db.collection('activitytemplates').createIndex({ name: 1 });
    await db.collection('activitytemplates').createIndex({ activityGroup: 1 });
    await db.collection('activitytemplates').createIndex({ type: 1 });
    await db.collection('activitytemplates').createIndex({ tags: 1 });
    await db.collection('activitytemplates').createIndex({ isActive: 1 });
    await db.collection('activitytemplates').createIndex({ gymId: 1, activityGroup: 1 });

    // Benchmark Templates collection indexes
    console.log('📊 Creating BenchmarkTemplate indexes...');
    await db.collection('benchmarktemplates').createIndex({ gymId: 1 });
    await db.collection('benchmarktemplates').createIndex({ name: 1 });
    await db.collection('benchmarktemplates').createIndex({ type: 1 });
    await db.collection('benchmarktemplates').createIndex({ tags: 1 });
    await db.collection('benchmarktemplates').createIndex({ isActive: 1 });

    // Workout Programs collection indexes
    console.log('📝 Creating WorkoutProgram indexes...');
    await db.collection('workoutprograms').createIndex({ gymId: 1 });
    await db.collection('workoutprograms').createIndex({ name: 1 });
    await db.collection('workoutprograms').createIndex({ difficulty: 1 });
    await db.collection('workoutprograms').createIndex({ tags: 1 });
    await db.collection('workoutprograms').createIndex({ isActive: 1 });
    await db.collection('workoutprograms').createIndex({ isTemplate: 1 });
    await db.collection('workoutprograms').createIndex({ gymId: 1, isActive: 1 });

    // Schedule Templates collection indexes
    console.log('📅 Creating ScheduleTemplate indexes...');
    await db.collection('scheduletemplates').createIndex({ gymId: 1 });
    await db.collection('scheduletemplates').createIndex({ name: 1 });
    await db.collection('scheduletemplates').createIndex({ isDefault: 1 });
    await db.collection('scheduletemplates').createIndex({ 'timeslots.dayOfWeek': 1 });
    await db.collection('scheduletemplates').createIndex({ 'timeslots.coachId': 1 });
    await db.collection('scheduletemplates').createIndex({ 'timeslots.locationId': 1 });

    // Weekly Schedules collection indexes
    console.log('🗓️  Creating WeeklySchedule indexes...');
    await db.collection('weeklyschedules').createIndex({ gymId: 1 });
    await db.collection('weeklyschedules').createIndex({ weekStartDate: 1 });
    await db.collection('weeklyschedules').createIndex({ status: 1 });
    await db.collection('weeklyschedules').createIndex({ templateId: 1 });
    await db.collection('weeklyschedules').createIndex({ gymId: 1, weekStartDate: 1 });
    await db.collection('weeklyschedules').createIndex({ 'timeslots.coachId': 1 });
    await db.collection('weeklyschedules').createIndex({ 'timeslots.enrolledClients.clientId': 1 });
    await db.collection('weeklyschedules').createIndex({ 'timeslots.dayOfWeek': 1 });

    // Client collection indexes
    console.log('👤 Creating Client indexes...');
    await db.collection('clients').createIndex({ userId: 1 }, { unique: true });
    await db.collection('clients').createIndex({ gymId: 1 });
    await db.collection('clients').createIndex({ 'personalInfo.firstName': 1 });
    await db.collection('clients').createIndex({ 'personalInfo.lastName': 1 });
    await db.collection('clients').createIndex({ 'membershipInfo.isActive': 1 });
    await db.collection('clients').createIndex({ 'currentProgram.programId': 1 });
    await db.collection('clients').createIndex({ 'activeBenchmarks.templateId': 1 });
    await db.collection('clients').createIndex({ 'activeBenchmarks.recordedAt': 1 });

    // Compound indexes for common queries
    console.log('🔗 Creating compound indexes...');
    
    // User queries by gym and type
    await db.collection('users').createIndex({ gymId: 1, userType: 1, isActive: 1 });
    
    // Activity templates by gym and filters
    await db.collection('activitytemplates').createIndex({ 
      gymId: 1, 
      type: 1, 
      isActive: 1 
    });
    
    // Workout programs by gym and status
    await db.collection('workoutprograms').createIndex({ 
      gymId: 1, 
      isActive: 1, 
      isTemplate: 1 
    });
    
    // Schedule queries by gym and week
    await db.collection('weeklyschedules').createIndex({ 
      gymId: 1, 
      weekStartDate: 1, 
      status: 1 
    });
    
    // Client membership queries
    await db.collection('clients').createIndex({ 
      gymId: 1, 
      'membershipInfo.isActive': 1 
    });

    console.log('✅ All database indexes created successfully!');
    
    // List created indexes for verification
    const collections = await db.listCollections().toArray();
    console.log('\n📝 Index Summary:');
    
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).listIndexes().toArray();
      console.log(`  ${collection.name}: ${indexes.length} indexes`);
    }

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

const runIndexCreation = async () => {
  try {
    await connectDB();
    await createIndexes();
    console.log('\n🎉 Index creation completed!');
  } catch (error) {
    console.error('❌ Index creation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the script if called directly
if (require.main === module) {
  runIndexCreation();
}

export { createIndexes };