import mongoose from 'mongoose';
import { ConnectOptions } from 'mongoose';

interface DatabaseConfig {
  uri: string;
  options: ConnectOptions;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogicv3';
  
  const options: ConnectOptions = {
    serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  };

  return { uri, options };
};

export const connectDB = async (): Promise<void> => {
  try {
    const { uri, options } = getDatabaseConfig();

    console.log('URI', uri)
    
    // Connect to MongoDB
    await mongoose.connect(uri, options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[state as keyof typeof states] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    readyState: state
  };
};

export const getDatabaseStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }

  const admin = mongoose.connection.db?.admin();
  const stats = await admin?.serverStatus();
  
  return {
    connections: stats?.connections || {},
    uptime: stats?.uptime || 0,
    version: stats?.version || 'unknown'
  };
};

export default mongoose;