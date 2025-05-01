// Description: Routes for managing user progress on videos.
import { Router } from 'express';
import passport from '../config/passport';
import {
  getProgress,
  updateProgress,
} from '../controllers/progressController';

const router = Router();

// Apply JWT auth to all progress routes
const requireAuth = passport.authenticate('jwt', { session: false });

// GET /api/progress/:videoId
router.get('/:videoId', requireAuth, getProgress);

// POST /api/progress/update
router.post('/update', requireAuth, updateProgress);

export default router;

