import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || 'Stockpatterns';

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is missing.');
  }

  try {
    const db = await mongoose.connect(mongoUri, {
      dbName: dbName,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log(`Connected to MongoDB database: ${dbName}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}
