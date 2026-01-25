import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SmartlinkTimerProps {
  open: boolean;
  duration: number;
  reward: number;
  sessionId: string;
  smartlinkUrl: string;
  onComplete: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
}

export function SmartlinkTimer({
  open,
  duration,
  reward,
  sessionId,
  smartlinkUrl,
  onComplete,
  onCancel,
}: SmartlinkTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (!open || !hasOpened || isPaused || isComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, hasOpened, isPaused, isComplete]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTimeRemaining(duration);
      setIsPaused(false);
      setIsComplete(false);
      setHasOpened(false);
    }
  }, [open, duration]);

  const handleOpenLink = useCallback(() => {
    // Open the smartlink ad URL
    window.open(smartlinkUrl, '_blank', 'noopener,noreferrer');
    setHasOpened(true);
  }, [smartlinkUrl]);

  const handleComplete = useCallback(() => {
    onComplete(sessionId);
  }, [onComplete, sessionId]);

  const handleClose = useCallback(() => {
    onCancel(sessionId);
  }, [onCancel, sessionId]);

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {isComplete ? 'Video Completed!' : 'Earn Credits'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!hasOpened ? (
            // Step 1: Open the link
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Click the button below to open the video in a new tab. 
                The timer will start once you open it.
              </p>
              <Button onClick={handleOpenLink} className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open Video
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll earn <span className="font-bold text-primary">+{reward} SC</span> after {duration} seconds
              </p>
            </div>
          ) : isComplete ? (
            // Step 3: Complete
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
          ) : (
            // Step 2: Timer running
            <div className="space-y-4">
              {isPaused && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Timer paused. Return to this tab to continue.
                  </p>
                </div>
              )}

              <div className="text-center">
                <div className={cn(
                  "text-5xl font-bold tabular-nums",
                  isPaused ? "text-yellow-500" : "text-foreground"
                )}>
                  {timeRemaining}s
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  remaining
                </p>
              </div>

              <Progress value={progress} className="h-2" />

              <p className="text-center text-sm text-muted-foreground">
                Keep watching to earn <span className="font-bold text-primary">+{reward} SC</span>
              </p>
            </div>
          )}
        </div>

        {!isComplete && (
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
