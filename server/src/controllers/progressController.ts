import { Request, Response } from 'express';
import ProgressModel, { IWatchedInterval } from '../models/Progress';

export const updateProgress = async (req: Request, res: Response) => {
  try {
    const { userId, videoId, watchedIntervals, lastPosition, videoDuration } = req.body;

    if (
      !userId ||
      !videoId ||
      !Array.isArray(watchedIntervals) ||
      typeof lastPosition !== 'number' ||
      typeof videoDuration !== 'number'
    ) {
      res.status(400).json({ error: 'Missing or invalid fields in request body' });
      return;
    }

    let progress = await ProgressModel.findOne({ userId, videoId });
    if (!progress) {
      progress = new ProgressModel({ userId, videoId, watchedIntervals: [], lastPosition: 0, progressPercent: 0 });
    }

    // Merge old and new intervals
    const allIntervals: IWatchedInterval[] = [
      ...progress.watchedIntervals,
      ...watchedIntervals,
    ];
    allIntervals.sort((a, b) => a.start - b.start);

    // Coalesce overlapping/adjacent intervals
    const merged: IWatchedInterval[] = [];
    for (const interval of allIntervals) {
      if (merged.length === 0) {
        merged.push({ start: interval.start, end: interval.end });
      } else {
        const last = merged[merged.length - 1];
        if (interval.start <= last.end + 1) {
          last.end = Math.max(last.end, interval.end);
        } else {
          merged.push({ start: interval.start, end: interval.end });
        }
      }
    }

    // Count unique seconds watched
    let uniqueSeconds = 0;
    for (const { start, end } of merged) {
      uniqueSeconds += end - start + 1;
    }

    // Safely compute percent (never divide by zero)
    const durationFloor = Math.floor(videoDuration);
    const progressPercent =
      durationFloor > 0 ? (uniqueSeconds / durationFloor) * 100 : 0;

    // Persist
    progress.watchedIntervals = merged;
    progress.lastPosition = lastPosition;
    progress.progressPercent = progressPercent;

    await progress.save();

    res.status(200).json({ success: true, progressPercent });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, videoId } = req.params;
    const progress = await ProgressModel.findOne({ userId, videoId });
    if (!progress) {
      res.status(404).json({ message: 'Progress not found' });
      return;
    }
    res.status(200).json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
