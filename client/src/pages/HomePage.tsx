// Description: Home page for handling video playback, progress tracking, and user authentication.
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
// import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// interface JWTPayload {
//     sub: string;
//     iat: number;
//     exp: number;
// }

interface WatchedInterval {
    start: number;
    end: number;
}

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { videoId = 'lecture2' } = useParams<{ videoId: string }>();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [progressPercent, setProgressPercent] = useState<number>(0);

    const watchedSecondsRef = useRef<Set<number>>(new Set());
    const newIntervalsRef = useRef<WatchedInterval[]>([]);
    const currentIntervalRef = useRef<WatchedInterval | null>(null);

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login', { replace: true });
    };

    // On mount: configure Axios and fetch initial progress
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        // Set Axios defaults
        axios.defaults.baseURL = import.meta.env.BACKEND_URL || 'http://localhost:5000';
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // let userId: string;
        try {
            // const decoded = jwtDecode<JWTPayload>(token);
            // userId = decoded.sub;
        } catch {
            // Invalid token
            localStorage.removeItem('jwtToken');
            navigate('/login', { replace: true });
            return;
        }

        const fetchProgress = async () => {
            try {
                const res = await axios.get(`/api/progress/${videoId}`);
                const data = res.data;
                // Populate watched seconds
                if (data.watchedIntervals) {
                    data.watchedIntervals.forEach((interval: { start: number; end: number }) => {
                        for (let s = interval.start; s <= interval.end; s++) {
                            watchedSecondsRef.current.add(s);
                        }
                    });
                }
                // Seek to last position
                if (videoRef.current && data.lastPosition) {
                    videoRef.current.currentTime = data.lastPosition;
                }
                if (typeof data.progressPercent === 'number') {
                    setProgressPercent(data.progressPercent);
                }
            } catch (err: any) {
                if (err.response?.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('jwtToken');
                    navigate('/login', { replace: true });
                } else {
                    console.error('Failed to fetch progress:', err);
                }
            }
        };

        fetchProgress();
    }, [videoId, navigate]);

    // Track time updates and send progress on pause/ended/unload
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

                const uniqueCount = watchedSecondsRef.current.size;
                if (videoDuration > 0) {
                    setProgressPercent((uniqueCount / videoDuration) * 100);
                }
            }
        };

        const sendProgressData = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) return;
            // const decoded = jwtDecode<JWTPayload>(token);
            // const userId = decoded.sub;

            const intervalsToSend = [...newIntervalsRef.current];
            if (currentIntervalRef.current) {
                intervalsToSend.push(currentIntervalRef.current);
            }

            if (intervalsToSend.length > 0 && videoDuration > 0) {
                try {
                    await axios.post(
                        '/api/progress/update',
                        {
                            // userId,
                            videoId,
                            watchedIntervals: intervalsToSend,
                            lastPosition: videoEl.currentTime,
                            videoDuration,
                        },
                        { headers: { 'Content-Type': 'application/json' } }
                    );
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
    }, [videoDuration, videoId]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
        }
    };

    return (
        <div className="container mx-auto p-4">
            {/* Header with Logout */}
            <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
            <video
                ref={videoRef}
                src="/video.mp4"
                controls
                className="w-full rounded-lg shadow"
                onLoadedMetadata={handleLoadedMetadata}
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
