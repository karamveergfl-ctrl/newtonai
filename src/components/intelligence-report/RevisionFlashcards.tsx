import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RevisionFlashcard } from "@/types/liveSession";

interface RevisionFlashcardsProps {
  flashcards: RevisionFlashcard[];
}

export function RevisionFlashcards({ flashcards }: RevisionFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());

  const remaining = flashcards.filter((_, i) => !learned.has(i));
  const card = flashcards[currentIndex];

  const goTo = useCallback(
    (delta: number) => {
      setFlipped(false);
      setCurrentIndex((i) => {
        const next = i + delta;
        if (next < 0) return flashcards.length - 1;
        if (next >= flashcards.length) return 0;
        return next;
      });
    },
    [flashcards.length]
  );

  const markLearned = useCallback(() => {
    setLearned((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    goTo(1);
  }, [currentIndex, goTo]);

  const reset = useCallback(() => {
    setLearned(new Set());
    setCurrentIndex(0);
    setFlipped(false);
  }, []);

  if (flashcards.length === 0) return null;

  const allLearned = learned.size >= flashcards.length;

  if (allLearned) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold">All {flashcards.length} cards reviewed! 🎉</p>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 text-xs">
            <RotateCcw className="w-3 h-3" /> Practice Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">🃏 Revision Flashcards</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{currentIndex + 1}/{flashcards.length}</span>
            <span>·</span>
            <span className="text-emerald-500">{learned.size} learned</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 justify-center">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setFlipped(false); }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                learned.has(i)
                  ? "bg-emerald-500"
                  : i === currentIndex
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Card with 3D flip */}
        <div
          className="relative w-full cursor-pointer"
          style={{ perspective: "1000px", minHeight: "160px" }}
          onClick={() => setFlipped((f) => !f)}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
              minHeight: "160px",
            }}
          >
            {/* Front */}
            <div
              className={cn(
                "absolute inset-0 rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center text-center",
                learned.has(currentIndex) && "opacity-50"
              )}
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-xs text-muted-foreground mb-2">Question</p>
              <p className="text-sm font-medium">{card?.front}</p>
              <p className="text-[10px] text-muted-foreground mt-3">Tap to flip</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <p className="text-xs text-primary mb-2">Answer</p>
              <p className="text-sm">{card?.back}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); goTo(-1); }}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={(e) => { e.stopPropagation(); markLearned(); }}
            className="gap-1.5 text-xs h-8"
            disabled={learned.has(currentIndex)}
          >
            <Check className="w-3 h-3" />
            {learned.has(currentIndex) ? "Learned" : "Mark as Learned"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); goTo(1); }}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
