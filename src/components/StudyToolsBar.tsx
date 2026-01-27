import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Network, 
  Loader2,
  Camera,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GenerationSettingsDialog, GenerationSettings } from "./GenerationSettingsDialog";
import { FEATURE_COSTS } from "@/lib/creditConfig";
import { useCredits } from "@/hooks/useCredits";

interface StudyToolsBarProps {
  onGenerateQuiz: (settings?: GenerationSettings) => void;
  onGenerateFlashcards: (settings?: GenerationSettings) => void;
  onGenerateSummary: () => void;
  onGenerateMindMap: () => void;
  onScreenshot?: () => void;
  isGeneratingQuiz: boolean;
  isGeneratingFlashcards: boolean;
  isGeneratingSummary: boolean;
  isGeneratingMindMap: boolean;
  disabled?: boolean;
  className?: string;
  totalPages?: number;
}

export const StudyToolsBar = ({
  onGenerateQuiz,
  onGenerateFlashcards,
  onGenerateSummary,
  onGenerateMindMap,
  onScreenshot,
  isGeneratingQuiz,
  isGeneratingFlashcards,
  isGeneratingSummary,
  isGeneratingMindMap,
  disabled,
  className,
  totalPages = 10,
}: StudyToolsBarProps) => {
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  const [showFlashcardSettings, setShowFlashcardSettings] = useState(false);
  const { isPremium } = useCredits();
  
  const isAnyGenerating = isGeneratingQuiz || isGeneratingFlashcards || isGeneratingSummary || isGeneratingMindMap;

  const CreditBadge = ({ feature }: { feature: string }) => {
    if (isPremium) return null;
    const cost = FEATURE_COSTS[feature];
    if (!cost) return null;
    return (
      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-medium gap-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ml-1">
        <Coins className="h-2.5 w-2.5" />
        {cost}
      </Badge>
    );
  };

  const handleQuizClick = () => {
    if (totalPages > 1) {
      setShowQuizSettings(true);
    } else {
      onGenerateQuiz();
    }
  };

  const handleFlashcardsClick = () => {
    if (totalPages > 1) {
      setShowFlashcardSettings(true);
    } else {
      onGenerateFlashcards();
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-2 p-2 bg-card/50 border-b overflow-x-auto scrollbar-hide", className)}>
        {!className?.includes('border-0') && <span className="text-xs font-medium text-muted-foreground mr-2 whitespace-nowrap hidden sm:inline">Study Tools:</span>}
        
        <Button
          onClick={handleQuizClick}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 shrink-0"
        >
          {isGeneratingQuiz ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 text-primary" />
          )}
          <span className="text-xs hidden sm:inline">Quiz</span>
          <CreditBadge feature="quiz" />
        </Button>

        {/* Flashcards */}
        <Button
          onClick={handleFlashcardsClick}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 shrink-0"
        >
          {isGeneratingFlashcards ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4 text-violet-500" />
          )}
          <span className="text-xs hidden sm:inline">Flashcards</span>
          <CreditBadge feature="flashcards" />
        </Button>

        {/* Notes (was Summary) */}
        <Button
          onClick={onGenerateSummary}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 shrink-0"
        >
          {isGeneratingSummary ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-xs hidden sm:inline">Notes</span>
          <CreditBadge feature="summary" />
        </Button>

        {/* Mind Map */}
        <Button
          onClick={onGenerateMindMap}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 shrink-0"
        >
          {isGeneratingMindMap ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Network className="w-4 h-4 text-rose-500" />
          )}
          <span className="text-xs hidden sm:inline">Mind Map</span>
          <CreditBadge feature="mind_map" />
        </Button>

        {onScreenshot && (
          <Button
            onClick={onScreenshot}
            disabled={disabled || isAnyGenerating}
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 shrink-0"
          >
            <Camera className="w-4 h-4 text-orange-500" />
            <span className="text-xs hidden sm:inline">Screenshot</span>
          </Button>
        )}
      </div>

      {/* Quiz Settings Dialog */}
      <GenerationSettingsDialog
        open={showQuizSettings}
        onOpenChange={setShowQuizSettings}
        type="quiz"
        totalPages={totalPages}
        onGenerate={(settings) => onGenerateQuiz(settings)}
      />

      {/* Flashcard Settings Dialog */}
      <GenerationSettingsDialog
        open={showFlashcardSettings}
        onOpenChange={setShowFlashcardSettings}
        type="flashcards"
        totalPages={totalPages}
        onGenerate={(settings) => onGenerateFlashcards(settings)}
      />
    </>
  );
};
