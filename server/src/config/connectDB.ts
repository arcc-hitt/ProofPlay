// Description: MongoDB connection logic using Mongoose.
import mongoose from 'mongoose';
import env from './env';
import logger from './logger';

export default async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed', err);
    process.exit(1);
  }
}
