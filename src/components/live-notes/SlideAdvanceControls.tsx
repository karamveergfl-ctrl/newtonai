import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideAdvanceControlsProps {
  sessionId: string;
  totalSlides: number;
  currentSlideIndex: number;
  isGenerating?: boolean;
  generationError?: string | null;
  onAdvance: (slideIndex: number, context: string, title?: string) => void;
  onPrev?: (slideIndex: number) => void;
  getSlideContent?: (slideIndex: number) => { context: string; title?: string } | null;
}

export function SlideAdvanceControls({
  totalSlides,
  currentSlideIndex,
  isGenerating = false,
  generationError = null,
  onAdvance,
  onPrev,
  getSlideContent,
}: SlideAdvanceControlsProps) {
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "loading";
  } | null>(null);

  // Success/error message auto-clear
  useEffect(() => {
    if (!isGenerating && !generationError && statusMessage?.type === "loading") {
      setStatusMessage({ text: "✓ Notes ready", type: "success" });
      const t = setTimeout(() => setStatusMessage(null), 2000);
      return () => clearTimeout(t);
    }
    if (generationError) {
      setStatusMessage({ text: "⚠️ Notes failed — tap to retry", type: "error" });
    }
  }, [isGenerating, generationError, statusMessage?.type]);

  const handleNext = useCallback(() => {
    if (currentSlideIndex >= totalSlides) return;
    const next = currentSlideIndex + 1;
    const slide = getSlideContent?.(next);
    setStatusMessage({ text: `Generating notes for slide ${next}…`, type: "loading" });
    onAdvance(next, slide?.context ?? "", slide?.title);
  }, [currentSlideIndex, totalSlides, onAdvance, getSlideContent]);

  const handlePrev = useCallback(() => {
    if (currentSlideIndex <= 1) return;
    onPrev?.(currentSlideIndex - 1);
  }, [currentSlideIndex, onPrev]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1"
          disabled={currentSlideIndex <= 1}
          onClick={handlePrev}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </Button>

        <span className="text-xs text-muted-foreground tabular-nums flex-1 text-center">
          Slide {currentSlideIndex} / {totalSlides}
        </span>

        <Button
          size="sm"
          className="h-8 text-xs gap-1"
          disabled={currentSlideIndex >= totalSlides || isGenerating}
          onClick={handleNext}
          aria-label="Next slide"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Status line */}
      {statusMessage && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-[10px] justify-center animate-fade-in",
            statusMessage.type === "success" && "text-green-400",
            statusMessage.type === "error" && "text-amber-400",
            statusMessage.type === "loading" && "text-muted-foreground"
          )}
        >
          {statusMessage.type === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
          {statusMessage.type === "success" && <Check className="w-3 h-3" />}
          {statusMessage.type === "error" && <AlertTriangle className="w-3 h-3" />}
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}
