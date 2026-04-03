import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchPair {
  left: string;
  right: string;
}

interface MatchQuestionProps {
  pairs: MatchPair[];
  showResult: boolean;
  userMatches: Record<number, number>; // leftIndex -> rightIndex
  onMatch: (matches: Record<number, number>) => void;
  onSubmit: () => void;
}

export const MatchQuestion = ({
  pairs,
  showResult,
  userMatches,
  onMatch,
  onSubmit,
}: MatchQuestionProps) => {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  // Shuffled right-side items (stable via pairs reference)
  const [shuffledRight] = useState(() => {
    const indices = pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });

  const handleLeftClick = (index: number) => {
    if (showResult) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (rightOriginalIndex: number) => {
    if (showResult || selectedLeft === null) return;
    const newMatches = { ...userMatches, [selectedLeft]: rightOriginalIndex };
    onMatch(newMatches);
    setSelectedLeft(null);
  };

  const getMatchedRightForLeft = (leftIdx: number): number | undefined => {
    return userMatches[leftIdx];
  };

  const isRightMatched = (rightOriginalIdx: number): boolean => {
    return Object.values(userMatches).includes(rightOriginalIdx);
  };

  const getMatchColor = (leftIdx: number) => {
    const colors = [
      "bg-primary/20 border-primary",
      "bg-secondary/20 border-secondary",
      "bg-accent/20 border-accent",
      "bg-blue-500/20 border-blue-500",
      "bg-purple-500/20 border-purple-500",
      "bg-orange-500/20 border-orange-500",
    ];
    return colors[leftIdx % colors.length];
  };

  const allMatched = Object.keys(userMatches).length === pairs.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        {showResult ? "Results:" : "Click a left item, then click its match on the right"}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, i) => {
            const isMatched = userMatches[i] !== undefined;
            const isSelected = selectedLeft === i;
            const isCorrectMatch = showResult && userMatches[i] === i;
            const isWrongMatch = showResult && isMatched && userMatches[i] !== i;

            return (
              <button
                key={`left-${i}`}
                onClick={() => handleLeftClick(i)}
                disabled={showResult}
                className={cn(
                  "w-full p-3 rounded-lg border-2 text-left text-sm transition-all",
                  isSelected && "ring-2 ring-primary ring-offset-2",
                  isMatched && !showResult && getMatchColor(i),
                  showResult && isCorrectMatch && "bg-accent/10 border-accent",
                  showResult && isWrongMatch && "bg-destructive/10 border-destructive",
                  !isSelected && !isMatched && !showResult && "bg-card border-border hover:border-primary/50",
                  !showResult && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2">
                  {showResult && isCorrectMatch && <CheckCircle className="w-4 h-4 text-accent-foreground shrink-0" />}
                  {showResult && isWrongMatch && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                  <span className="flex-1">{pair.left}</span>
                  {isMatched && !showResult && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map((originalIdx) => {
            const isMatched = isRightMatched(originalIdx);
            const matchedLeftIdx = Object.entries(userMatches).find(([_, v]) => v === originalIdx)?.[0];
            const leftIdx = matchedLeftIdx !== undefined ? parseInt(matchedLeftIdx) : undefined;

            return (
              <button
                key={`right-${originalIdx}`}
                onClick={() => handleRightClick(originalIdx)}
                disabled={showResult || selectedLeft === null}
                className={cn(
                  "w-full p-3 rounded-lg border-2 text-left text-sm transition-all",
                  isMatched && leftIdx !== undefined && !showResult && getMatchColor(leftIdx),
                  showResult && isMatched && leftIdx === originalIdx && "bg-accent/10 border-accent",
                  showResult && isMatched && leftIdx !== originalIdx && "bg-destructive/10 border-destructive",
                  !isMatched && !showResult && "bg-card border-border",
                  !showResult && selectedLeft !== null && !isMatched && "hover:border-primary/50 cursor-pointer",
                  !showResult && selectedLeft === null && "opacity-70"
                )}
              >
                {pairs[originalIdx].right}
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div className="text-sm text-muted-foreground text-center">
          {Object.entries(userMatches).filter(([k, v]) => parseInt(k) === v).length} of {pairs.length} correct
        </div>
      )}

      {!showResult && allMatched && (
        <Button onClick={onSubmit} className="w-full h-12">
          Submit Matches
        </Button>
      )}
    </div>
  );
};
