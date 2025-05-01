// Description: Express server setup with MongoDB connection and API routes
import express from 'express';
import cors from 'cors';
import connectDB from './config/connectDB';
import progressRoutes from './routes/progressRoutes';
import authRoutes from './routes/authRoutes';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
connectDB();

app.use(express.json());

// API routes for authentication
app.use('/auth', authRoutes);

// API routes for progress tracking
app.use('/api/progress', progressRoutes);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
