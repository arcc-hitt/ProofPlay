// Description: MongoDB connection logic using Mongoose.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  
  if (!mongoURI) {
    console.error('MONGO_URI not found in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
