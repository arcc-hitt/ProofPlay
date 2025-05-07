// Description: Home page for handling video playback, progress tracking, and user authentication.
import React, { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { logout } from '@/lib/auth';

interface WatchedInterval {
  start: number;
  end: number;
}

const HomePage: React.FC = () => {
  const { videoId = 'lecture2' } = useParams<{ videoId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const watchedSecondsRef = useRef<Set<number>>(new Set());
  const newIntervalsRef = useRef<WatchedInterval[]>([]);
  const currentIntervalRef = useRef<WatchedInterval | null>(null);

  // Fetch initial progress on mount
  useEffect(() => {
    api
      .get(`/api/progress/${videoId}`)
      .then(({ data }) => {
        // Populate watched seconds
        data.watchedIntervals?.forEach((iv: WatchedInterval) => {
          for (let s = iv.start; s <= iv.end; s++) {
            watchedSecondsRef.current.add(s);
          }
        });
        // Seek to last saved position
        if (videoRef.current && data.lastPosition) {
          videoRef.current.currentTime = data.lastPosition;
        }
        // Initialize progress bar
        setProgressPercent(data.progressPercent ?? 0);
      })
      .catch((err) => {
        // Global interceptor will handle 401; show others here
        console.error('Failed to fetch progress:', err);
        toast.error('Error fetching your progress. Please try again.');
      }).finally(() => {
        setLoading(false);
      });
  }, [videoId]);

  // Track watching progress and send updates
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (videoEl.paused) return;
      const sec = Math.floor(videoEl.currentTime);
      if (!watchedSecondsRef.current.has(sec)) {
        watchedSecondsRef.current.add(sec);

        if (!currentIntervalRef.current) {
          currentIntervalRef.current = { start: sec, end: sec };
        } else if (sec === currentIntervalRef.current.end + 1) {
          currentIntervalRef.current.end = sec;
        } else {
          newIntervalsRef.current.push(currentIntervalRef.current);
          currentIntervalRef.current = { start: sec, end: sec };
        }

        if (videoDuration > 0) {
          setProgressPercent(
            (watchedSecondsRef.current.size / videoDuration) * 100
          );
        }
      }
    };

    const sendProgressData = () => {
      const vid = videoEl;
      const intervalsToSend = [...newIntervalsRef.current];
      if (currentIntervalRef.current) {
        intervalsToSend.push(currentIntervalRef.current);
      }
      if (intervalsToSend.length === 0 || videoDuration === 0) return;

      api
        .post('/api/progress/update', {
          videoId,
          watchedIntervals: intervalsToSend,
          lastPosition: vid.currentTime,
          videoDuration,
        })
        .then(() => {
          newIntervalsRef.current = [];
          currentIntervalRef.current = null;
        })
        .catch((err) => {
          console.error('Progress update failed:', err);
          // errors are also toasted globally
        });
    };

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('pause', sendProgressData);
    videoEl.addEventListener('ended', sendProgressData);
    window.addEventListener('beforeunload', sendProgressData);

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('pause', sendProgressData);
      videoEl.removeEventListener('ended', sendProgressData);
      window.removeEventListener('beforeunload', sendProgressData);
    };
  }, [videoDuration, videoId]);

  // Capture duration once metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(Math.floor(videoRef.current.duration));
    }
  };

  if (loading) {
    // Skeleton placeholders for header, video, and progress bar
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-20 rounded" />
        </div>
        <Skeleton className="w-full h-96 rounded-lg" />
        <Skeleton className="w-full h-3 rounded" />
        <Skeleton className="w-24 h-5 rounded mx-auto" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => logout()}>
          Logout
        </Button>
      </div>

      <video
        ref={videoRef}
        src="/video.mp4"
        controls
        className="w-full rounded-lg shadow"
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => toast.error('Failed to load video.')}
      />

      <div className="my-4">
        <Progress value={progressPercent} max={100} className="w-full h-3" />
        <p className="mt-2 text-center text-sm font-medium">
          {progressPercent.toFixed(2)}% watched
        </p>
      </div>
    </div>
  );
};

export default HomePage;
