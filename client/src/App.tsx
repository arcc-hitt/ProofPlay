import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';

type Interval = { start: number; end: number };

const VideoPlayer = ({ videoId, userId }: { videoId: string; userId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watched, setWatched] = useState<Interval[]>([]);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [lastPosition, setLastPosition] = useState(0);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/progress/${userId}/${videoId}`).then(({ data }) => {
      setWatched(data?.watchedIntervals || []);
      setProgress(data?.progressPercent || 0);
      setLastPosition(data?.lastPosition || 0);
    });
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = Math.floor(video.currentTime);
    const alreadyWatched = watched.some(({ start, end }) => currentTime >= start && currentTime < end);

    if (!alreadyWatched) {
      const newInterval = { start: currentTime, end: currentTime + 1 };
      const newWatched = [...watched, newInterval];

      setWatched(newWatched);
      axios.post('http://localhost:5000/api/progress/update', {
        userId,
        videoId,
        newInterval,
        lastPosition: currentTime,
        videoDuration: video.duration,
      }).then(({ data }) => {
        setProgress(data.progressPercent);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <video
        ref={videoRef}
        src="/video.mp4"
        controls
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
            videoRef.current.currentTime = lastPosition;
          }
        }}
        className="rounded-xl w-full"
      />
      <div className="mt-4">
        <Progress value={progress} />
        <p className="mt-2 text-center text-sm text-gray-500">{progress.toFixed(2)}% watched</p>
      </div>
    </div>
  );
};

export default VideoPlayer;
