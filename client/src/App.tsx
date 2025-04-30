// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Progress } from './components/ui/progress';

const App: React.FC = () => {
  const userId = 'user123';
  const videoId = 'lecture1';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const watchedSecondsRef = useRef<Set<number>>(new Set());
  const newIntervalsRef = useRef<Array<{ start: number; end: number }>>([]);
  const currentIntervalRef = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/progress/${userId}/${videoId}`);
        const data = res.data;
        if (data.watchedIntervals) {
          data.watchedIntervals.forEach((interval: { start: number; end: number }) => {
            for (let s = interval.start; s <= interval.end; s++) {
              watchedSecondsRef.current.add(s);
            }
          });
        }
        if (videoRef.current && data.lastPosition) {
          videoRef.current.currentTime = data.lastPosition;
        }
        if (typeof data.progressPercent === 'number') {
          setProgressPercent(data.progressPercent);
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      }
    };
    fetchProgress();
  }, [userId, videoId]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      const currentTime = videoEl.currentTime;
      const sec = Math.floor(currentTime);

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

        const uniqueCount = watchedSecondsRef.current.size;
        const dur = videoDuration;
        if (dur > 0) {
          setProgressPercent((uniqueCount / dur) * 100);
        }
      }
    };

    const sendProgressData = async () => {
      const intervalsToSend = [...newIntervalsRef.current];
      if (currentIntervalRef.current) {
        intervalsToSend.push(currentIntervalRef.current);
      }

      // only send if we have metadata (videoDuration > 0)
      if (intervalsToSend.length > 0 && videoDuration > 0) {
        const payload = {
          userId,
          videoId,
          watchedIntervals: intervalsToSend,
          lastPosition: videoEl.currentTime,
          videoDuration,             // use state, never NaN
        };

        try {
          await axios.post('http://localhost:5000/api/progress/update', payload, {
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (err) {
          console.error('Progress update failed:', err);
        }

        newIntervalsRef.current = [];
        currentIntervalRef.current = null;
      }
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
  }, [videoDuration, userId, videoId]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <video
        ref={videoRef}
        src="/video.mp4"
        controls
        className="w-full"
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div className="my-4">
        <Progress value={progressPercent} max={100} className="w-full h-3" />
        <p className="mt-2 text-center">{progressPercent.toFixed(2)}% watched</p>
      </div>
    </div>
  );
};

export default App;
