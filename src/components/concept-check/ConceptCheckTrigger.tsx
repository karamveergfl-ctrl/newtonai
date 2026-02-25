import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Zap, AlertCircle } from "lucide-react";

interface ConceptCheckTriggerProps {
  isGenerating: boolean;
  generationError: string | null;
  rateLimitSeconds: number | null;
  onTrigger: (difficulty: "easy" | "medium" | "hard") => void;
}

const difficulties = ["easy", "medium", "hard"] as const;

export function ConceptCheckTrigger({
  isGenerating,
  generationError,
  rateLimitSeconds,
  onTrigger,
}: ConceptCheckTriggerProps) {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const isRateLimited = rateLimitSeconds !== null && rateLimitSeconds > 0;
  const hasError = !!generationError && !isGenerating;
  const isDisabled = isGenerating || isRateLimited;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        onClick={() => onTrigger(difficulty)}
        disabled={isDisabled}
        aria-label={
          isRateLimited
            ? `Wait ${rateLimitSeconds} seconds`
            : hasError
              ? "Retry concept check"
              : "Check understanding"
        }
        className={cn(
          "w-full min-h-[56px] text-base font-semibold transition-colors",
          hasError
            ? "bg-red-600 hover:bg-red-700 text-white"
            : isRateLimited
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700 text-white"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Generating question…
          </>
        ) : isRateLimited ? (
          <>Wait {rateLimitSeconds}s</>
        ) : hasError ? (
          <>
            <AlertCircle className="w-5 h-5 mr-2" />
            Failed — Try Again
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Check Understanding
          </>
        )}
      </Button>

      {/* Difficulty pills */}
      <div className="flex gap-1.5 justify-center">
        {difficulties.map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            disabled={isDisabled}
            aria-label={`Set difficulty to ${d}`}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors border",
              d === difficulty
                ? "bg-teal-600/20 border-teal-500/40 text-teal-300"
                : "bg-transparent border-gray-700 text-gray-500 hover:text-gray-300"
            )}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
