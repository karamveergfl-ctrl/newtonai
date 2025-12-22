import { useState } from "react";
import { Flashcard } from "./Flashcard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  RotateCcw, 
  X,
  Trophy,
  Sparkles,
  Check,
  RotateCw
} from "lucide-react";

interface FlashcardData {
  id: string;
  front: string;
  back: string;
}

interface FlashcardDeckProps {
  flashcards: FlashcardData[];
  title: string;
  onClose: () => void;
}

export const FlashcardDeck = ({ flashcards, title, onClose }: FlashcardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(flashcards);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [showCongrats, setShowCongrats] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const progress = (completedCards.size / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false); // Reset to question side
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false); // Reset to question side
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setCards(flashcards);
    setCurrentIndex(0);
    setCompletedCards(new Set());
    setShowCongrats(false);
    setIsFlipped(false);
  };

  const markMastered = () => {
    const newCompleted = new Set(completedCards);
    newCompleted.add(cards[currentIndex].id);
    setCompletedCards(newCompleted);
    
    if (newCompleted.size === cards.length) {
      setShowCongrats(true);
    } else if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const unmarkMastered = () => {
    const newCompleted = new Set(completedCards);
    newCompleted.delete(cards[currentIndex].id);
    setCompletedCards(newCompleted);
  };

  const isMastered = completedCards.has(cards[currentIndex]?.id);

  if (showCongrats) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="relative">
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 animate-bounce" />
            <Sparkles className="absolute top-0 right-1/4 w-8 h-8 text-primary animate-pulse" />
            <Sparkles className="absolute bottom-0 left-1/4 w-6 h-6 text-secondary animate-pulse delay-300" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Congratulations! 🎉
          </h2>
          <p className="text-muted-foreground">
            You've completed all {cards.length} flashcards!
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Study Again
            </Button>
            <Button onClick={onClose} className="gap-2">
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {completedCards.size} of {cards.length} mastered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleShuffle} variant="ghost" size="icon" title="Shuffle">
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button onClick={handleReset} variant="ghost" size="icon" title="Reset">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-3">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Flashcard
          front={cards[currentIndex].front}
          back={cards[currentIndex].back}
          index={currentIndex}
          total={cards.length}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-card/50">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Flip Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleFlip}
              variant="outline"
              size="lg"
              className="gap-2 w-40"
            >
              <RotateCw className="w-4 h-4" />
              Flip Card
            </Button>
          </div>

          {/* Navigation Row */}
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            <Button
              onClick={isMastered ? unmarkMastered : markMastered}
              className={`gap-2 ${isMastered ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'}`}
              size="lg"
            >
              <Check className="w-4 h-4" />
              {isMastered ? "Mastered ✓" : "Mastered"}
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
