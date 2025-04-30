// app.ts (Express server setup)
import express from 'express';
import cors from 'cors';
import connectDB from './config/connectDB';
import progressRoutes from './routes/progressRoutes';

const app = express();
app.use(cors());
connectDB();

app.use(express.json());

// API routes for progress tracking
app.use('/api/progress', progressRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
