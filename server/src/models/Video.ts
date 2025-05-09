import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  videoId: string;
  url: string;
  duration: number;
}

const VideoSchema = new Schema<IVideo>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IVideo>('Video', VideoSchema);
