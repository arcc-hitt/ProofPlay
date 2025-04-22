import mongoose from 'mongoose';

const IntervalSchema = new mongoose.Schema({
  start: Number,
  end: Number,
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  videoId: { type: String, required: true },
  watchedIntervals: [IntervalSchema],
  lastPosition: Number,
  videoDuration: Number,
  progressPercent: Number,
}, { timestamps: true });

export default mongoose.model('Progress', ProgressSchema);
