import { Request, Response, NextFunction } from 'express';
import Progress from '../models/Progress';

interface Interval {
  start: number;
  end: number;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  intervals.sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];

  for (const current of intervals) {
    if (!merged.length || merged[merged.length - 1].end < current.start) {
      merged.push(current);
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, current.end);
    }
  }

  return merged;
}

function getUniqueSeconds(intervals: Interval[]): number {
  return intervals.reduce((acc, { start, end }) => acc + (end - start), 0);
}

// POST /api/progress/update
export const updateProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId,
      videoId,
      newInterval,
      lastPosition,
      videoDuration,
    }: {
      userId: string;
      videoId: string;
      newInterval: Interval;
      lastPosition: number;
      videoDuration: number;
    } = req.body;

    let progress = await Progress.findOne({ userId, videoId });

    if (!progress) {
      progress = new Progress({
        userId,
        videoId,
        watchedIntervals: [],
        lastPosition,
        videoDuration,
      });
    }

    // Convert watchedIntervals to plain objects
    const existingIntervals: Interval[] = progress.watchedIntervals.map((interval) => ({
      start: interval.start ?? 0,
      end: interval.end ?? 0,
    }));

    const merged = mergeIntervals([...existingIntervals, newInterval]);
    const uniqueSeconds = getUniqueSeconds(merged);
    const progressPercent = Math.min((uniqueSeconds / videoDuration) * 100, 100);

    // Safely set merged intervals on Mongoose document
    progress.set('watchedIntervals', merged);
    progress.lastPosition = lastPosition;
    progress.videoDuration = videoDuration;
    progress.progressPercent = progressPercent;

    await progress.save();

    res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
};

// GET /api/progress/:userId/:videoId
export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, videoId } = req.params;
    const progress = await Progress.findOne({ userId, videoId });

    if (!progress) {
      res.status(404).json({ message: 'Progress not found' });
    } else {
      res.status(200).json(progress);
    }
  } catch (error) {
    next(error);
  }
};
