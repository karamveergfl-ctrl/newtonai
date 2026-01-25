import { useState, useEffect, useCallback, useRef } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

declare global {
  interface Window {
    AdProvider?: Array<{ serve: Record<string, unknown> }>;
  }
}

interface OutstreamVideoPlayerProps {
  open: boolean;
  zoneId: string;
  reward: number;
  sessionId: string;
  onComplete: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
  onError: () => void;
}

type AdState = 'loading' | 'waiting' | 'playing' | 'complete' | 'error';

export function OutstreamVideoPlayer({
  open,
  zoneId,
  reward,
  sessionId,
  onComplete,
  onCancel,
  onError,
}: OutstreamVideoPlayerProps) {
  const [adState, setAdState] = useState<AdState>('loading');
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle visibility change - pause when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Initialize ad when dialog opens
  useEffect(() => {
    if (!open) {
      cleanup();
      setAdState('loading');
      return;
    }

    const initAd = async () => {
      setAdState('loading');

      // Check if script already loaded
      const existingScript = document.querySelector('script[src*="ad-provider.js"]');
      
      if (!existingScript) {
        // Inject the ad-provider script
        const script = document.createElement('script');
        script.src = 'https://a.magsrv.com/ad-provider.js';
        script.async = true;
        script.type = 'application/javascript';
        
        script.onload = () => {
          console.log('[OutstreamVideoPlayer] Script loaded');
          scriptLoadedRef.current = true;
          initializeAdProvider();
        };

        script.onerror = () => {
          console.error('[OutstreamVideoPlayer] Script failed to load');
          setAdState('error');
          onError();
        };

        document.head.appendChild(script);
      } else {
        scriptLoadedRef.current = true;
        initializeAdProvider();
      }
    };

    const initializeAdProvider = () => {
      setAdState('waiting');

      // Initialize AdProvider
      (window.AdProvider = window.AdProvider || []).push({ serve: {} });
      console.log('[OutstreamVideoPlayer] AdProvider initialized for zone:', zoneId);

      // Start checking for ad content
      let checkCount = 0;
      const maxChecks = 30; // 15 seconds max wait

      checkIntervalRef.current = setInterval(() => {
        checkCount++;
        
        if (containerRef.current) {
          // Check if an iframe or video has been injected by the SDK
          const iframe = containerRef.current.querySelector('iframe');
          const video = containerRef.current.querySelector('video');
          
          if (iframe || video) {
            console.log('[OutstreamVideoPlayer] Ad content detected');
            setAdState('playing');
            
            // Monitor for video completion
            if (video) {
              video.addEventListener('ended', () => {
                console.log('[OutstreamVideoPlayer] Video ended');
                setAdState('complete');
              });
            }

            // Fallback: mark complete after duration (30s for safety)
            timeoutRef.current = setTimeout(() => {
              if (adState !== 'complete') {
                console.log('[OutstreamVideoPlayer] Timeout - marking complete');
                setAdState('complete');
              }
            }, 35000);

            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
            return;
          }
        }

        if (checkCount >= maxChecks) {
          console.log('[OutstreamVideoPlayer] No ad detected after timeout');
          cleanup();
          setAdState('error');
          onError();
        }
      }, 500);
    };

    initAd();

    return cleanup;
  }, [open, zoneId, onError, cleanup, adState]);

  const handleComplete = useCallback(() => {
    cleanup();
    onComplete(sessionId);
  }, [onComplete, sessionId, cleanup]);

  const handleClose = useCallback(() => {
    cleanup();
    onCancel(sessionId);
  }, [onCancel, sessionId, cleanup]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent 
        className="sm:max-w-lg" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {adState === 'complete' ? 'Video Completed!' : 'Watch Video to Earn Credits'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ad Container */}
          <div 
            ref={containerRef}
            className="relative min-h-[280px] bg-muted/50 rounded-lg flex items-center justify-center overflow-hidden"
          >
            {/* The ins element that ExoClick SDK will populate */}
            <ins 
              className="eas6a97888e37" 
              data-zoneid={zoneId}
              style={{ display: 'block', width: '100%', minHeight: '250px' }}
            />

            {/* Loading overlay */}
            {(adState === 'loading' || adState === 'waiting') && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {adState === 'loading' ? 'Loading ad...' : 'Waiting for video...'}
                </p>
              </div>
            )}

            {/* Paused overlay */}
            {isPaused && adState === 'playing' && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Video paused. Return to this tab to continue.
                </p>
              </div>
            )}

            {/* Complete overlay */}
            {adState === 'complete' && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    +{reward} Credits!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click below to claim your reward
                  </p>
                </div>
                <Button onClick={handleComplete} className="w-full max-w-[200px]">
                  Claim Credits
                </Button>
              </div>
            )}

            {/* Error state */}
            {adState === 'error' && (
              <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  No video available. Trying fallback...
                </p>
              </div>
            )}
          </div>

          {/* Reward info */}
          {adState !== 'complete' && adState !== 'error' && (
            <p className="text-center text-sm text-muted-foreground">
              Watch the video to earn <span className="font-bold text-primary">+{reward} SC</span>
            </p>
          )}
        </div>

        {/* Cancel button */}
        {adState !== 'complete' && (
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
