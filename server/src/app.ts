import express from 'express';
import cors from 'cors';
import { connectDB } from './config/connectDB';
import progressRoutes from './routes/progressRoutes';
import dotenv from 'dotenv';
dotenv.config(); 

const app = express();
app.use(cors());
app.use(express.json());

const { MONGO_URI, PORT } = process.env;
connectDB(MONGO_URI!);

app.use('/api/progress', progressRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
