import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface FlashcardProps {
  front: string;
  back: string;
  index: number;
  total: number;
  isFlipped: boolean;
  onFlip: () => void;
}

export const Flashcard = ({ front, back, index, total, isFlipped, onFlip }: FlashcardProps) => {
  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto perspective-1000 px-2 sm:px-0">
      <div className="text-center mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">
        Card {index + 1} of {total}
      </div>
      <div
        onClick={onFlip}
        className={cn(
          "relative w-full aspect-[4/3] sm:aspect-[3/2] cursor-pointer transition-transform duration-500 preserve-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center",
            "bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20",
            "border-2 border-primary/30 shadow-xl"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-primary mb-2 sm:mb-3 font-semibold">
            Question
          </div>
          <div className="text-base sm:text-lg md:text-xl font-medium text-center text-foreground leading-relaxed overflow-auto max-h-[calc(100%-3rem)]">
            <MarkdownRenderer content={front} className="prose-sm" />
          </div>
          <div className="absolute bottom-3 sm:bottom-4 text-[10px] sm:text-xs text-muted-foreground">
            Tap to flip
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center",
            "bg-gradient-to-br from-secondary/20 via-secondary/10 to-accent/20",
            "border-2 border-secondary/30 shadow-xl rotate-y-180"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-secondary mb-2 sm:mb-3 font-semibold">
            Answer
          </div>
          <div className="text-sm sm:text-base md:text-lg text-center text-foreground leading-relaxed overflow-auto max-h-[calc(100%-3rem)]">
            <MarkdownRenderer content={back} className="prose-sm" />
          </div>
          <div className="absolute bottom-3 sm:bottom-4 text-[10px] sm:text-xs text-muted-foreground">
            Tap to flip
          </div>
        </div>
      </div>
    </div>
  );
};
