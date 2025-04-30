// Progress.ts (Mongoose model for progress collection)
import mongoose, { Document, Schema } from 'mongoose';

export interface IWatchedInterval {
  start: number;
  end: number;
}

export interface IProgress extends Document {
  userId: string;
  videoId: string;
  watchedIntervals: IWatchedInterval[];
  lastPosition: number;
  progressPercent: number;
}

const WatchedIntervalSchema: Schema = new Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
});

const ProgressSchema: Schema = new Schema({
  userId: { type: String, required: true },
  videoId: { type: String, required: true },
  watchedIntervals: { type: [WatchedIntervalSchema], default: [] },
  lastPosition: { type: Number, default: 0 },
  progressPercent: { type: Number, default: 0 },
});

export default mongoose.model<IProgress>('Progress', ProgressSchema);
