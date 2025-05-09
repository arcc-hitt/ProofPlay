import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import throttle from 'lodash.throttle';
import api from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WatchedInterval {
  start: number;
  end: number;
}
interface VideoItem {
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
}

// Memoized video card to prevent re-renders
const VideoCard = memo(
  ({ v, isSelected, onSelect }: { v: VideoItem; isSelected: boolean; onSelect: () => void }) => (
    <Card
      onClick={onSelect}
      className={`mb-4 py-3 cursor-pointer hover:bg-gray-50 transition {{
        isSelected ? 'bg-gray-200' : ''
      }}`}
    >
      <CardHeader className="flex items-center space-x-2 px-3">
        <Avatar>
          <AvatarImage src={v.thumbnail} alt={v.title} />
          <AvatarFallback>{v.title.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-wrap">{v.title}</CardTitle>
          <CardDescription>Duration: {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  )
);
VideoCard.displayName = 'VideoCard';

const HomePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);

  const watchedSecondsRef = useRef<Set<number>>(new Set());
  const newIntervalsRef = useRef<WatchedInterval[]>([]);
  const currentIntervalRef = useRef<WatchedInterval | null>(null);

  // Fetch videos once
  useEffect(() => {
    api
      .get<VideoItem[]>('/api/videos/list')
      .then(({ data }) => {
        setVideos(data);
        if (!selected && data.length) setSelected(data[0]);
      })
      .catch(() => toast.error('Failed to load videos'))
      .finally(() => setIsLoadingVideos(false));
  }, []);

  // Fetch saved progress on selection
  useEffect(() => {
    if (!selected) return;
    watchedSecondsRef.current.clear();
    newIntervalsRef.current = [];
    currentIntervalRef.current = null;

    api
      .get(`/api/progress/videos/${selected.videoId}`)
      .then(({ data }) => {
        data.watchedIntervals?.forEach((iv: WatchedInterval) => {
          for (let s = iv.start; s <= iv.end; s++) watchedSecondsRef.current.add(s);
        });
        if (videoRef.current && data.lastPosition) {
          videoRef.current.currentTime = data.lastPosition;
        }
        setProgressPercent(data.progressPercent ?? 0);
      })
      .catch((err) => {
        console.error('Failed to fetch progress:', err);
        toast.error('Error fetching your progress. Please try again.');
      });
  }, [selected]);

  // Throttled time update handler
  const handleTimeUpdate = useCallback(
    throttle(() => {
      const videoEl = videoRef.current;
      if (!videoEl || videoEl.paused) return;
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
          setProgressPercent((watchedSecondsRef.current.size / videoDuration) * 100);
        }
      }
    }, 500),
    [videoDuration]
  );

  // Progress sync
  const sendProgressData = useCallback(() => {
    const vidEl = videoRef.current;
    if (!vidEl || videoDuration === 0) return;
    const intervalsToSend = [...newIntervalsRef.current];
    if (currentIntervalRef.current) intervalsToSend.push(currentIntervalRef.current);

    api
      .post('/api/progress/update', {
        videoId: selected!.videoId,
        watchedIntervals: intervalsToSend,
        lastPosition: vidEl.currentTime,
        videoDuration,
      })
      .then(() => {
        newIntervalsRef.current = [];
        currentIntervalRef.current = null;
      })
      .catch((err) => console.error('Progress update failed:', err));
  }, [selected, videoDuration]);

  // Attach playback listeners
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

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
  }, [handleTimeUpdate, sendProgressData]);

  // Once metadata loaded, set duration and hide loader
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(Math.floor(videoRef.current.duration));
      setIsVideoLoading(false);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-80 border-r bg-white flex-col overflow-y-auto">
        <div className="px-4 py-5 border-b">
          <h2 className="text-lg font-semibold">My Videos</h2>
        </div>
        <ScrollArea className="flex-1 p-4">
          {isLoadingVideos ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : videos.length > 0 ? (
            videos.map((v) => (
              <VideoCard
                key={v.videoId}
                v={v}
                isSelected={selected?.videoId === v.videoId}
                onSelect={() => setSelected(v)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>No videos available.</p>
            </div>
          )}
        </ScrollArea>
      </aside>

      <div className="flex-1 flex flex-col w-screen">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between bg-white px-4 py-3 border-b">
          <Select
            value={selected?.videoId}
            onValueChange={(val) => {
              const v = videos.find((x) => x.videoId === val);
              if (v) setSelected(v);
            }}
          >
            <SelectTrigger className="w-full text-start">
              <SelectValue placeholder="Select a video" />
            </SelectTrigger>
            <SelectContent className="max-w-full w-[var(--radix-select-trigger-width)] overflow-auto">
              {videos.map((v) => (
                <SelectItem key={v.videoId} value={v.videoId}>
                  {v.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={logout} className="ml-2">
            Logout
          </Button>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between bg-white px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold truncate">{selected?.title ?? 'Select a video'}</h1>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </header>

        {/* Video Player & Progress */}
        <main className="flex-1 overflow-auto p-6">
          {selected ? (
            <Card className="max-w-4xl mx-auto space-y-6">
              <CardContent className="relative p-0">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <span className="text-white">Loading video...</span>
                  </div>
                )}
                <video
                  ref={videoRef}
                  src={selected.url}
                  controls
                  className="w-full rounded-lg object-contain"
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={() => {
                    setIsVideoLoading(false);
                    toast.error('Failed to load video');
                  }}
                />
              </CardContent>

              <CardContent className="space-y-2">
                <div className="flex items-center space-x-4">
                  <Progress value={progressPercent} max={100} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{progressPercent.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No video selected.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
