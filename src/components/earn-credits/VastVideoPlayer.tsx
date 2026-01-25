import { useState, useEffect, useCallback, useRef } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface VastVideoPlayerProps {
  open: boolean;
  vastUrl: string;
  reward: number;
  sessionId: string;
  onComplete: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
  onError: () => void;
}

interface VastData {
  mediaUrl: string;
  duration: number;
  clickThroughUrl?: string;
  trackingEvents: {
    impression?: string[];
    start?: string[];
    firstQuartile?: string[];
    midpoint?: string[];
    thirdQuartile?: string[];
    complete?: string[];
    clickTracking?: string[];
  };
}

export function VastVideoPlayer({
  open,
  vastUrl,
  reward,
  sessionId,
  onComplete,
  onCancel,
  onError,
}: VastVideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vastData, setVastData] = useState<VastData | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const firedEvents = useRef<Set<string>>(new Set());

  // Fire tracking pixels
  const fireTrackingPixels = useCallback((urls: string[] | undefined) => {
    if (!urls) return;
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Parse VAST XML
  const parseVast = useCallback(async (xml: string): Promise<VastData | null> => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      
      // Check for VAST error
      const vastError = doc.querySelector('Error');
      if (vastError && !doc.querySelector('Ad')) {
        console.error('VAST returned no ads');
        return null;
      }

      // Get media file
      const mediaFile = doc.querySelector('MediaFile');
      if (!mediaFile) {
        console.error('No MediaFile found in VAST');
        return null;
      }

      const mediaUrl = mediaFile.textContent?.trim() || '';
      
      // Get duration
      const durationNode = doc.querySelector('Duration');
      let duration = 30; // Default 30 seconds
      if (durationNode?.textContent) {
        const parts = durationNode.textContent.split(':');
        if (parts.length === 3) {
          duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
      }

      // Get tracking events
      const trackingEvents: VastData['trackingEvents'] = {};
      const trackingNodes = doc.querySelectorAll('Tracking');
      trackingNodes.forEach(node => {
        const event = node.getAttribute('event');
        const url = node.textContent?.trim();
        if (event && url) {
          const key = event as keyof typeof trackingEvents;
          if (!trackingEvents[key]) {
            trackingEvents[key] = [];
          }
          trackingEvents[key]!.push(url);
        }
      });

      // Get impression URLs
      const impressionNodes = doc.querySelectorAll('Impression');
      trackingEvents.impression = [];
      impressionNodes.forEach(node => {
        const url = node.textContent?.trim();
        if (url) {
          trackingEvents.impression!.push(url);
        }
      });

      // Get ClickThrough URL (for ExoClick and other VAST providers)
      const clickThroughUrl = doc.querySelector('ClickThrough')?.textContent?.trim();
      
      // Get ClickTracking URLs
      const clickTrackingNodes = doc.querySelectorAll('ClickTracking');
      trackingEvents.clickTracking = [];
      clickTrackingNodes.forEach(node => {
        const url = node.textContent?.trim();
        if (url) {
          trackingEvents.clickTracking!.push(url);
        }
      });

      return { mediaUrl, duration, clickThroughUrl, trackingEvents };
    } catch (err) {
      console.error('Error parsing VAST:', err);
      return null;
    }
  }, []);

  // Fetch and parse VAST
  useEffect(() => {
    if (!open || !vastUrl) return;

    const fetchVast = async () => {
      setLoading(true);
      setError(null);
      firedEvents.current.clear();
      
      try {
        const response = await fetch(vastUrl);
        if (!response.ok) throw new Error('Failed to fetch VAST');
        
        const xml = await response.text();
        const data = await parseVast(xml);
        
        if (!data || !data.mediaUrl) {
          throw new Error('No video ad available');
        }
        
        setVastData(data);
        
        // Fire impression pixels
        fireTrackingPixels(data.trackingEvents.impression);
      } catch (err) {
        console.error('VAST fetch error:', err);
        setError('Failed to load video ad');
        onError();
      } finally {
        setLoading(false);
      }
    };

    fetchVast();
  }, [open, vastUrl, parseVast, fireTrackingPixels, onError]);

  // Handle video progress
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !vastData) return;
    
    const video = videoRef.current;
    const percent = (video.currentTime / video.duration) * 100;
    setProgress(percent);

    // Fire tracking events at appropriate times
    const events = vastData.trackingEvents;
    
    if (percent >= 0 && !firedEvents.current.has('start')) {
      firedEvents.current.add('start');
      fireTrackingPixels(events.start);
    }
    if (percent >= 25 && !firedEvents.current.has('firstQuartile')) {
      firedEvents.current.add('firstQuartile');
      fireTrackingPixels(events.firstQuartile);
    }
    if (percent >= 50 && !firedEvents.current.has('midpoint')) {
      firedEvents.current.add('midpoint');
      fireTrackingPixels(events.midpoint);
    }
    if (percent >= 75 && !firedEvents.current.has('thirdQuartile')) {
      firedEvents.current.add('thirdQuartile');
      fireTrackingPixels(events.thirdQuartile);
    }
  }, [vastData, fireTrackingPixels]);

  // Handle video complete
  const handleVideoEnded = useCallback(() => {
    if (!vastData) return;
    
    if (!firedEvents.current.has('complete')) {
      firedEvents.current.add('complete');
      fireTrackingPixels(vastData.trackingEvents.complete);
    }
    
    setIsComplete(true);
  }, [vastData, fireTrackingPixels]);

  // Handle visibility change (pause when tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        videoRef.current?.pause();
      } else {
        setIsPaused(false);
        videoRef.current?.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setProgress(0);
      setIsComplete(false);
      setIsPaused(false);
      setError(null);
      firedEvents.current.clear();
    }
  }, [open]);

  const handleComplete = useCallback(() => {
    onComplete(sessionId);
  }, [onComplete, sessionId]);

  const handleClose = useCallback(() => {
    onCancel(sessionId);
  }, [onCancel, sessionId]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent 
        className="sm:max-w-lg" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {isComplete ? 'Video Completed!' : 'Watch to Earn Credits'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Loading video ad...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-destructive mt-2">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">Falling back to alternative...</p>
            </div>
          ) : isComplete ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  +{reward} Credits!
                </p>
                <p className="text-sm text-muted-foreground">
                  Click below to claim your reward
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full">
                Claim Credits
              </Button>
            </div>
          ) : vastData ? (
            <div className="space-y-4">
              {isPaused && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Video paused. Return to this tab to continue.
                  </p>
                </div>
              )}

              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={vastData.mediaUrl}
                  className="w-full h-full object-contain cursor-pointer"
                  autoPlay
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  onPlay={() => setIsPaused(false)}
                  onPause={() => setIsPaused(true)}
                  onClick={() => {
                    if (vastData.clickThroughUrl) {
                      // Fire click tracking pixels
                      fireTrackingPixels(vastData.trackingEvents.clickTracking);
                      window.open(vastData.clickThroughUrl, '_blank');
                    }
                  }}
                />
                {vastData.clickThroughUrl && (
                  <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded pointer-events-none">
                    Click to learn more
                  </div>
                )}
              </div>

              <Progress value={progress} className="h-2" />

              <p className="text-center text-sm text-muted-foreground">
                Watch the full video to earn <span className="font-bold text-primary">+{reward} SC</span>
              </p>
            </div>
          ) : null}
        </div>

        {!isComplete && !loading && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleClose} className="gap-1">
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
