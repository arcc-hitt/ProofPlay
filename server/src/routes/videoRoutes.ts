// Description: Routes for handling video uploads and listings using Cloudinary and MongoDB.
import { Router, Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import passport from '../config/passport';
import cloudinary from '../config/cloudinary';
import { ResourceApiResponse } from 'cloudinary';
import VideoModel, { IVideo } from '../models/Video';
import { title } from 'process';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

/**
 * GET /api/videos/list
 * Lists up to 100 videos in the `videos/` folder.
 */
router.get(
  '/list',
  requireAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      // Must explicitly set resource_type: 'video'
      const result: ResourceApiResponse = await cloudinary.api.resources({
        resource_type: 'video',
        type: 'upload',
        prefix: 'videos/',
        max_results: 100,
        context: true,
        metadata: true,
      });

      const videos = (result.resources || []).map(r => {
        // Derive pure videoId
        const fullId = r.public_id;
        const videoId = fullId.split('/').pop()!;

        // Extract title from metadata or fallback to videoId
        const context = r.context as any;
        const title = (r.context as any)?.custom?.caption || videoId;
        const durationStr = (r.context as any)?.custom?.duration;

        // Generate a JPG thumbnail URL (middle frame by default)
        const thumbnail = cloudinary.url(fullId, {
          resource_type: 'video',
          format: 'jpg',
          width: 300,
          crop: 'scale',
        });

        // Full video URL
        const url = r.secure_url;
        const duration = Number(durationStr) || 0;

        return { videoId, title, url, thumbnail, duration };
      });

      // Upsert each into MongoDB
      await Promise.all(
        videos.map(v =>
          VideoModel.updateOne(
            { videoId: v.videoId },
            {
              $set: { url: v.url },
              $setOnInsert: {
                userId: (req.user as any)._id,
                duration: v.duration,
              },
            },
            { upsert: true }
          )
        )
      );

      res.json(videos);
    } catch (err: any) {
      console.error('❌ Cloudinary list error:', err.message || err);
      res
        .status(500)
        .json({ error: 'Failed to list videos from Cloudinary' });
    }
  })
);

export default router;
