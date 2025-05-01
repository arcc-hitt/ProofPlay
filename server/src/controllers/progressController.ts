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
    const progress = await ProgressModel.findOne({ user: user.id, videoId });

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

    const {
      videoId,
      watchedIntervals,
      lastPosition,
      videoDuration,
    } = req.body as {
      videoId: string;
      watchedIntervals: IWatchedInterval[];
      lastPosition: number;
      videoDuration: number;
    };

    // Validate
    if (
      !videoId ||
      !Array.isArray(watchedIntervals) ||
      typeof lastPosition !== 'number' ||
      typeof videoDuration !== 'number'
    ) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // Find or create
    let progress = await ProgressModel.findOne({ user: user.id, videoId });
    if (!progress) {
      progress = new ProgressModel({
        user: user.id,
        videoId,
        watchedIntervals: [],
        lastPosition: 0,
        progressPercent: 0,
      });
    }

    // Merge and coalesce intervals
    const allIntervals = [...progress.watchedIntervals, ...watchedIntervals].sort(
      (a, b) => a.start - b.start
    );
    const merged: IWatchedInterval[] = [];
    for (const interval of allIntervals) {
      if (!merged.length || interval.start > merged[merged.length - 1].end + 1) {
        merged.push({ ...interval });
      } else {
        merged[merged.length - 1].end = Math.max(
          merged[merged.length - 1].end,
          interval.end
        );
      }
    }

    // Compute percent
    let uniqueSeconds = 0;
    for (const { start, end } of merged) {
      uniqueSeconds += end - start + 1;
    }
    const percent =
      Math.floor(videoDuration) > 0
        ? (uniqueSeconds / Math.floor(videoDuration)) * 100
        : 0;

    progress.watchedIntervals = merged;
    progress.lastPosition = lastPosition;
    progress.progressPercent = percent;

    await progress.save();
    res.status(200).json({ success: true, progressPercent: percent });
    return;
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Server error' });
    return;
  }
};
