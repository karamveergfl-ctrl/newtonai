import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, RotateCcw, CheckCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";

interface FlashcardCompletionScreenProps {
  totalCards: number;
  masteredCount: number;
  onRetry: () => void;
  onDone: () => void;
}

export const FlashcardCompletionScreen = ({
  totalCards,
  masteredCount,
  onRetry,
  onDone
}: FlashcardCompletionScreenProps) => {
  const percentage = Math.round((masteredCount / totalCards) * 100);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <ConfettiCelebration isActive={true} />
      
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        {/* Trophy with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative inline-block"
        >
          <div className={cn(
            "w-28 h-28 rounded-full flex items-center justify-center mx-auto",
            percentage >= 80 
              ? "bg-gradient-to-br from-yellow-400/20 to-amber-500/20" 
              : percentage >= 50 
              ? "bg-gradient-to-br from-blue-300/20 to-blue-400/20"
              : "bg-gradient-to-br from-orange-400/20 to-red-500/20"
          )}>
            <Layers className={cn(
              "w-14 h-14",
              percentage >= 80 ? "text-yellow-500" : percentage >= 50 ? "text-blue-500" : "text-orange-600"
            )} />
          </div>
          <Sparkles className="absolute top-0 right-0 w-8 h-8 text-primary animate-pulse" />
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-bold">
          {percentage >= 80 ? "Excellent! 🎉" : percentage >= 50 ? "Good Progress! 👍" : "Keep Practicing! 📚"}
        </h2>
        
        <div className="space-y-2">
          <motion.p 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent"
          >
            {masteredCount}/{totalCards}
          </motion.p>
          <p className="text-muted-foreground">
            cards reviewed
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 border">
          <p className="text-sm text-muted-foreground mb-1">Completion</p>
          <p className="text-2xl font-bold text-primary">
            {percentage}%
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={onRetry} variant="outline" className="h-12 gap-2 flex-1 sm:flex-none">
            <RotateCcw className="w-4 h-4" />
            Study Again
          </Button>
          <Button onClick={onDone} className="h-12 gap-2 flex-1 sm:flex-none">
            <CheckCircle className="w-4 h-4" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
