import { useState, useEffect } from "react";
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
  RotateCw,
  Download,
  Loader2,
  BookOpen,
  ArrowLeft
} from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface FlashcardData {
  id: string;
  front: string;
  back: string;
}

interface FlashcardDeckProps {
  flashcards: FlashcardData[];
  title: string;
  onClose: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const FlashcardDeck = ({ 
  flashcards, 
  title, 
  onClose, 
  isLoading = false,
  loadingMessage = "Generating flashcards..." 
}: FlashcardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(flashcards);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [showCongrats, setShowCongrats] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { toast } = useToast();

  // Update cards when flashcards prop changes
  useEffect(() => {
    if (flashcards.length > 0) {
      setCards(flashcards);
    }
  }, [flashcards]);

  // Animate progress bar while loading
  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 30) return prev + 3;
          if (prev < 60) return prev + 2;
          if (prev < 85) return prev + 0.5;
          return prev;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isLoading]);

  const progress = cards.length > 0 ? (completedCards.size / cards.length) * 100 : 0;

  const downloadAsPDF = async () => {
    setIsDownloading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yOffset = 20;

      pdf.setFontSize(18);
      pdf.text(title, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 15;

      pdf.setFontSize(12);
      flashcards.forEach((card, idx) => {
        if (yOffset > 250) {
          pdf.addPage();
          yOffset = 20;
        }
        
        pdf.setFont(undefined, 'bold');
        pdf.text(`Card ${idx + 1}`, 15, yOffset);
        yOffset += 8;

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(11);
        const frontLines = pdf.splitTextToSize(`Q: ${card.front}`, pageWidth - 30);
        pdf.text(frontLines, 15, yOffset);
        yOffset += frontLines.length * 5 + 5;

        const backLines = pdf.splitTextToSize(`A: ${card.back}`, pageWidth - 30);
        pdf.text(backLines, 15, yOffset);
        yOffset += backLines.length * 5 + 10;

        pdf.setFontSize(12);
      });

      pdf.save(`Flashcards_${title.slice(0, 30)}.pdf`);
      toast({ title: "Downloaded", description: "Flashcards PDF downloaded successfully" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

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

  const isMastered = cards[currentIndex] ? completedCards.has(cards[currentIndex].id) : false;

  // Loading state with skeleton
  if (isLoading || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{title}</h2>
              <p className="text-sm text-muted-foreground">Generating flashcards...</p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to PDF
            </Button>
          </div>
        </div>
        
        {/* Loading Progress */}
        <div className="px-4 py-3 bg-card border-b">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">{loadingMessage}</p>
              <Progress value={loadingProgress} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground w-10">{Math.round(loadingProgress)}%</span>
          </div>
        </div>
        
        {/* Skeleton Flashcard */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Skeleton Card */}
            <div className="relative h-64 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card shadow-lg overflow-hidden animate-pulse">
              <div className="absolute inset-0 p-6 flex flex-col">
                {/* Card number skeleton */}
                <div className="h-4 w-16 bg-muted rounded mb-4" />
                
                {/* Content skeleton lines */}
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-5 bg-muted rounded w-full" />
                  <div className="h-5 bg-muted rounded w-2/3" />
                </div>
                
                {/* Flip hint skeleton */}
                <div className="flex justify-center mt-4">
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            
            {/* Skeleton progress dots */}
            <div className="flex justify-center gap-1.5 mt-6">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 rounded-full bg-muted animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            
            {/* Loading message */}
            <div className="text-center mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Creating your flashcards</span>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Analyzing content and generating personalized cards...
              </p>
            </div>
          </div>
        </div>
        
        {/* Skeleton Controls */}
        <div className="p-4 border-t bg-card/50">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex justify-center">
              <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCongrats) {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
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
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header - Compact on mobile */}
      <div className="shrink-0 p-2 md:p-4 border-b bg-card/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm md:text-lg truncate">{title}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {completedCards.size}/{cards.length} mastered
            </p>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button 
              onClick={downloadAsPDF} 
              variant="outline" 
              size="icon" 
              disabled={isDownloading}
              title="Download PDF"
              className="h-8 w-8 md:h-9 md:w-9"
            >
              {isDownloading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Download className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
            <Button onClick={handleShuffle} variant="ghost" size="icon" title="Shuffle" className="h-8 w-8 md:h-9 md:w-9">
              <Shuffle className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
            <Button onClick={handleReset} variant="ghost" size="icon" title="Reset" className="h-8 w-8 md:h-9 md:w-9">
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
            <Button onClick={onClose} variant="outline" size="sm" className="gap-1 h-8 md:h-9 text-xs md:text-sm px-2 md:px-3">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <Progress value={progress} className="h-1.5 md:h-2 [&>div]:transition-all [&>div]:duration-500" />
        </div>
      </div>

      {/* Flashcard - Centered with padding for fixed footer */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-4 pb-32 md:pb-28 overflow-auto">
        <Flashcard
          front={cards[currentIndex].front}
          back={cards[currentIndex].back}
          index={currentIndex}
          total={cards.length}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Controls - Fixed at bottom, always visible */}
      <div className="shrink-0 fixed bottom-0 left-0 right-0 p-2 md:p-4 border-t bg-card/95 backdrop-blur-sm safe-area-pb z-[61]">
        <div className="max-w-lg mx-auto space-y-2 md:space-y-3">
          {/* Flip Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleFlip}
              variant="outline"
              size="default"
              className="gap-2 w-full sm:w-40 h-10 md:h-11"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-sm md:text-base">Flip Card</span>
            </Button>
          </div>

          {/* Navigation Row */}
          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              variant="outline"
              size="default"
              className="gap-1 flex-1 h-11 md:h-12"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm md:text-base">Prev</span>
            </Button>
            
            <Button
              onClick={isMastered ? unmarkMastered : markMastered}
              className={`gap-1 flex-1 h-11 md:h-12 ${isMastered ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'}`}
              size="default"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm md:text-base">{isMastered ? "✓" : "Done"}</span>
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              variant="outline"
              size="default"
              className="gap-1 flex-1 h-11 md:h-12"
            >
              <span className="hidden sm:inline text-sm md:text-base">Next</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
