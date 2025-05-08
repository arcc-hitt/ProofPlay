// Description: Home page for handling video playback, progress tracking, and user authentication.
import React, { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { logout } from '@/lib/auth';

interface WatchedInterval {
  start: number;
  end: number;
}

const HomePage: React.FC = () => {
  const { videoId = 'lecture1' } = useParams<{ videoId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

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
        // Global interceptor will handle 401 show others here
        console.error('Failed to fetch progress:', err);
        toast.error('Error fetching your progress. Please try again.');
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
      if (videoDuration === 0) return;

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

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex justify-end">
        <Button variant="default" onClick={() => logout()}>Logout</Button>
      </header>

      <section>
        <video
          ref={videoRef}
          src="/video.mp4"
          controls
          className="w-full rounded-lg shadow-lg"
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => toast.error('Failed to load video.')}
        />
      </section>

      <section className="space-y-2">
        <Progress value={progressPercent} max={100} className="w-full h-3" />
        <p className="text-center text-sm font-medium">
          {progressPercent.toFixed(2)}% watched
        </p>
      </section>
    </main>
  );
};

export default HomePage;
