import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface FlashcardProps {
  front: string;
  back: string;
  index: number;
  total: number;
  isFlipped: boolean;
  onFlip: () => void;
  isMastered?: boolean;
  onMarkMastered?: () => void;
}

export const Flashcard = ({ 
  front, 
  back, 
  index, 
  total, 
  isFlipped, 
  onFlip,
  isMastered,
  onMarkMastered
}: FlashcardProps) => {
  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto perspective-1000 px-2 sm:px-0">
      {/* Card number badge */}
      <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
            isMastered 
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-primary/10 text-primary"
          )}
        >
          {isMastered && <Check className="w-4 h-4" />}
          <span>Card {index + 1} of {total}</span>
        </motion.div>
      </div>

      <motion.div
        onClick={onFlip}
        className={cn(
          "relative w-full aspect-[4/3] cursor-pointer transition-transform duration-500 preserve-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{ transformStyle: "preserve-3d" }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center",
            "bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20",
            "border-2 border-primary/30 shadow-xl",
            "min-h-[200px] sm:min-h-[280px]"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Question label badge */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base">
              Q
            </span>
          </div>
          
          <div className="text-base sm:text-lg md:text-xl font-medium text-center text-foreground leading-relaxed overflow-auto max-h-[calc(100%-4rem)] px-4">
            <MarkdownRenderer content={front} className="prose-sm" />
          </div>
          
          <div className="absolute bottom-3 sm:bottom-4 flex items-center gap-2 text-muted-foreground">
            <span className="text-[11px] sm:text-xs">Tap to flip</span>
            <motion.div 
              animate={{ rotateY: [0, 180, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-4 h-4 border-2 border-current rounded"
            />
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center",
            "bg-gradient-to-br from-secondary/20 via-secondary/10 to-accent/20",
            "border-2 border-secondary/30 shadow-xl rotate-y-180",
            "min-h-[200px] sm:min-h-[280px]"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Answer label badge */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary text-secondary-foreground font-bold text-sm sm:text-base">
              A
            </span>
          </div>
          
          <div className="text-sm sm:text-base md:text-lg text-center text-foreground leading-relaxed overflow-auto max-h-[calc(100%-4rem)] px-4">
            <MarkdownRenderer content={back} className="prose-sm" />
          </div>
          
          <div className="absolute bottom-3 sm:bottom-4 flex items-center gap-2 text-muted-foreground">
            <span className="text-[11px] sm:text-xs">Tap to flip</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
