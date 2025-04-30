// progressRoutes.ts
import express from 'express';
import { getProgress, updateProgress } from '../controllers/progressController';

const router = express.Router();

// GET current progress (intervals and last position) for a user and video
router.get('/:userId/:videoId', getProgress);

// POST new watched intervals and last position
router.post('/update', updateProgress);

export default router;
