import { useState, useCallback } from "react";
import { useCredits } from "@/hooks/useCredits";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { CreditModal } from "@/components/CreditModal";
import { FEATURE_COSTS, FEATURE_NAMES } from "@/lib/creditConfig";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Coins } from "lucide-react";

interface VideoGateProps {
  videoId: string;
  videoTitle?: string;
  onUnlock: () => void;
  children: React.ReactNode;
}

export function VideoGate({ videoId, videoTitle, onUnlock, children }: VideoGateProps) {
  const { credits, isPremium, hasEnoughCredits, spendCredits, earnCredits, canWatchMoreAds, getRemainingAds } = useCredits();
  const { incrementUsage } = useFeatureUsage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const cost = FEATURE_COSTS.watch_video;

  const handleClick = useCallback(() => {
    if (isPremium) {
      incrementUsage('educational_videos');
      onUnlock();
      return;
    }

    if (hasEnoughCredits('watch_video')) {
      setShowConfirm(true);
    } else {
      setShowCreditModal(true);
    }
  }, [isPremium, hasEnoughCredits, onUnlock, incrementUsage]);

  const handleConfirm = async () => {
    const success = await spendCredits('watch_video');
    if (success) {
      await incrementUsage('educational_videos');
      setShowConfirm(false);
      onUnlock();
    }
  };

  const handleWatchAd = async (duration: 30 | 60) => {
    const success = await earnCredits(duration);
    if (success && credits + (duration === 30 ? 4 : 9) >= cost) {
      setShowCreditModal(false);
      setShowConfirm(true);
    }
    return success;
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Watch Video?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {videoTitle && (
                <span className="block font-medium text-foreground">{videoTitle}</span>
              )}
              <span className="flex items-center gap-1">
                This will use <Coins className="w-3.5 h-3.5 text-yellow-500 inline" /> 
                <strong>{cost} Study Credits</strong>
              </span>
              <span className="block text-sm">
                Your balance: {credits} SC → {credits - cost} SC
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="gap-1">
              Watch Video
              <span className="opacity-70">-{cost} SC</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit Modal for insufficient credits */}
      <CreditModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
        requiredCredits={cost}
        currentCredits={credits}
        featureName={FEATURE_NAMES.watch_video}
        onWatchAd={handleWatchAd}
        canWatchMoreAds={canWatchMoreAds()}
        remainingAds={getRemainingAds()}
      />
    </>
  );
}
