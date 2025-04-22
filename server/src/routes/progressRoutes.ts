import express from 'express';
import { updateProgress, getProgress } from '../controllers/progressController';

const router = express.Router();

router.post('/update', updateProgress);
router.get('/:userId/:videoId', getProgress);

export default router;
