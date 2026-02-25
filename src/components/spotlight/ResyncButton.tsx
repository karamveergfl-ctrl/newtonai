import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ResyncButtonProps {
  onResync: () => void;
  teacherSlideIndex: number;
  currentSlideIndex: number;
  isResyncing: boolean;
}

export function ResyncButton({ onResync, teacherSlideIndex, currentSlideIndex, isResyncing }: ResyncButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const slidesBehind = teacherSlideIndex - currentSlideIndex;

  useEffect(() => {
    if (!isResyncing && showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isResyncing, showSuccess]);

  const handleClick = () => {
    onResync();
    setShowSuccess(true);
  };

  if (showSuccess && !isResyncing) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium text-white transition-colors duration-150"
          style={{ animation: "resync-success 1.5s ease" }}
          aria-label="Resynced successfully"
        >
          <span>✓ Resynced!</span>
        </button>
        <style>{`
          @keyframes resync-success {
            0% { background-color: rgb(20,184,166); }
            30% { background-color: rgb(34,197,94); }
            100% { background-color: rgb(20,184,166); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {slidesBehind > 2 && (
        <span className="text-xs text-amber-400">You are {slidesBehind} slides behind</span>
      )}
      <button
        onClick={handleClick}
        disabled={isResyncing}
        className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors duration-150 disabled:opacity-60"
        aria-label={`Resync to teacher slide ${teacherSlideIndex + 1}`}
      >
        {isResyncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Resyncing…</span>
          </>
        ) : (
          <>
            <span>↺</span>
            <span>Back to Live — Slide {teacherSlideIndex + 1}</span>
          </>
        )}
      </button>
    </div>
  );
}
