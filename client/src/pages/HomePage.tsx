// Description: Home page for handling video playback, progress tracking, and user authentication.
import React, { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const HomePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selected, setSelected] = useState<VideoItem | null>(null);

  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const watchedSecondsRef = useRef<Set<number>>(new Set());
  const newIntervalsRef = useRef<WatchedInterval[]>([]);
  const currentIntervalRef = useRef<WatchedInterval | null>(null);

  // On mount, fetch all videos
  useEffect(() => {
    api.get<VideoItem[]>('/api/videos/list')
      .then(({ data }) => {
        setVideos(data);
        if (!selected && data.length) setSelected(data[0]);
      })
      .catch(() => toast.error('Failed to load videos'));
  }, []);

  // Fetch initial progress on mount
  useEffect(() => {
    if (!selected) return;

    api
      .get(`/api/progress/videos/${selected.videoId}`)
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
  }, [selected]);

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
          videoId: selected!.videoId,
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
  }, [videoDuration, selected]);

  // Capture duration once metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(Math.floor(videoRef.current.duration));
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar: hidden on small */}
      <aside className="hidden w-64 border-r bg-white md:flex flex-col h-screen overflow-y-auto">
        <div className="px-4 py-5 border-b">
          <h2 className="text-lg font-semibold">My Videos</h2>
        </div>
        <ScrollArea className="flex-1 p-4">
          {videos.length > 0 ? (
            videos.map(v => (
              <Card
                key={v.videoId}
                onClick={() => setSelected(v)}
                className={`mb-4 cursor-pointer hover:bg-gray-50 transition 
            ${selected?.videoId === v.videoId ? 'bg-gray-200' : ''}`}
              >
                <CardHeader className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={v.thumbnail} alt={v.title} />
                    <AvatarFallback>{v.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="truncate">{v.title}</CardTitle>
                  <CardDescription>Duration: {v.duration}</CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
              <svg
                className="w-12 h-12 opacity-50"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v2m0 8v2a2 2 0 002 2h2m8-14h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-4-10v4m-4 0h8"
                />
              </svg>
              <p className="text-sm">No videos available.</p>
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile select + Logout */}
        <header className="flex items-center justify-between bg-white px-4 py-3 md:hidden border-b">
          <Select
            value={selected?.videoId}
            onValueChange={val => {
              const v = videos.find(x => x.videoId === val);
              if (v) setSelected(v);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a video" />
            </SelectTrigger>
            <SelectContent>
              {videos.map(v => (
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
          <h1 className="text-2xl font-semibold">{selected?.title || 'Select a video'}</h1>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </header>

        {/* Video Player & Progress */}
        <main className="flex-1 overflow-auto p-6">
          {selected ? (
            <Card className="max-w-4xl mx-auto space-y-6">
              <CardContent>
                <video
                  ref={videoRef}
                  src={selected.url}
                  controls
                  className="w-full rounded-lg"
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={() => toast.error('Failed to load video')}
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
