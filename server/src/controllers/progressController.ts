// Description: Controller for managing authenticated user progress on videos.
import { RequestHandler, Response } from 'express';
import ProgressModel, { IWatchedInterval } from '../models/Progress';
import { IUser } from '../models/User';

// GET /api/progress/:videoId
// Returns the watching progress for the authenticated user.
export const getProgress: RequestHandler = async (req, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { videoId } = req.params;
    const progress = await ProgressModel.findOne({ userId: user._id, videoId });

    if (!progress) {
      res.status(200).json({
        watchedIntervals: [],
        lastPosition: 0,
        progressPercent: 0,
      });
      return;
    }

    res.status(200).json(progress);
    return;
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Server error' });
    return;
  }
};

// POST /api/progress/update
// Upserts watching progress for the authenticated user.
export const updateProgress: RequestHandler = async (req, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser | undefined;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Destructure and basic type checking
    const {
      videoId,
      watchedIntervals: rawIntervals,
      lastPosition,
      videoDuration: rawDuration,
    } = req.body as {
      videoId: any;
      watchedIntervals: any;
      lastPosition: any;
      videoDuration: any;
    };

    if (
      typeof videoId !== 'string' ||
      !Array.isArray(rawIntervals) ||
      typeof lastPosition !== 'number' ||
      typeof rawDuration !== 'number'
    ) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // Sanitize videoDuration and lastPosition
    const videoDuration = Math.floor(rawDuration);
    if (!Number.isFinite(videoDuration) || videoDuration <= 0) {
      res.status(400).json({ error: 'Invalid videoDuration' });
      return;
    }
    const safeLastPosition = Number(lastPosition) || 0;

    // Fetch or create the document
    let progress = await ProgressModel.findOne({ userId: user._id, videoId });
    if (!progress) {
      progress = new ProgressModel({
        userId: user._id,
        videoId,
        watchedIntervals: [],
        lastPosition: 0,
        progressPercent: 0,
      });
    }
    
    // Build a list of **valid** intervals from both old and new
    const normalize = (iv: any): IWatchedInterval | null => {
      const start = Number(iv.start);
      const end = Number(iv.end);
      if (
        Number.isInteger(start) &&
        Number.isInteger(end) &&
        start >= 0 &&
        end >= start &&
        start < videoDuration
      ) {
        // clamp end to duration-1
        return { start, end: Math.min(end, videoDuration - 1) };
      }
      return null;
    };

    const existingValid: IWatchedInterval[] = progress.watchedIntervals
      .map(normalize)
      .filter((iv): iv is IWatchedInterval => iv !== null);

    const incomingValid: IWatchedInterval[] = rawIntervals
      .map(normalize)
      .filter((iv): iv is IWatchedInterval => iv !== null);

    const allValid = [...existingValid, ...incomingValid].sort((a, b) => a.start - b.start);

    // Merge overlapping/adjacent intervals
    const merged: IWatchedInterval[] = [];
    for (const iv of allValid) {
      if (merged.length === 0 || iv.start > merged[merged.length - 1].end + 1) {
        merged.push({ ...iv });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
      }
    }

    // Compute unique seconds watched
    let uniqueSeconds = 0;
    for (const { start, end } of merged) {
      uniqueSeconds += end - start + 1;
    }

    // Safely compute progressPercent and round
    const rawPercent = (uniqueSeconds / videoDuration) * 100;
    const progressPercent = Number.isFinite(rawPercent)
      ? Math.round(rawPercent * 100) / 100
      : 0;

    // Assign back and save
    progress.watchedIntervals = merged;
    progress.lastPosition = safeLastPosition;
    progress.progressPercent = progressPercent;

    await progress.save();
    res.status(200).json({ success: true, progressPercent });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
