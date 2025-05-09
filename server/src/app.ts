// Description: Express server setup with MongoDB connection and API routes
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errors as celebrateErrors } from 'celebrate';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import progressRoutes from './routes/progressRoutes';
import env from './config/env';
import errorHandler from './middlewares/errorHandler';
import connectDB from './config/connectDB';
import logger from './config/logger';
import videoRoutes from './routes/videoRoutes';

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 })); // 100 req/min
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/videos', videoRoutes);

// Celebrate validation errors
app.use(celebrateErrors());

// Central error handler
app.use(errorHandler);

// Start the server
(async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });
})();
