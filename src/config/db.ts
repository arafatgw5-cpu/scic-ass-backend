import mongoose from 'mongoose';

// Cache the mongoose connection for serverless environments
let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const dbName = process.env.DB_NAME || 'scic-ass';
    
    const db = await mongoose.connect(mongoURI, {
      dbName,
      maxPoolSize: 10,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${db.connection.host}`);
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Don't exit process in serverless, throw instead
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
      process.exit(1);
    } else {
      throw error;
    }
  }
};
