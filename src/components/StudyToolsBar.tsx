import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Network, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GenerationSettingsDialog, GenerationSettings } from "./GenerationSettingsDialog";

interface StudyToolsBarProps {
  onGenerateQuiz: (settings?: GenerationSettings) => void;
  onGenerateFlashcards: (settings?: GenerationSettings) => void;
  onGenerateSummary: () => void;
  onGenerateMindMap: () => void;
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
  
  const isAnyGenerating = isGeneratingQuiz || isGeneratingFlashcards || isGeneratingSummary || isGeneratingMindMap;

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
      <div className={cn("flex items-center gap-2 p-2 bg-card/50 border-b", className)}>
        {!className?.includes('border-0') && <span className="text-xs font-medium text-muted-foreground mr-2">Study Tools:</span>}
        
        <Button
          onClick={handleQuizClick}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
        >
          {isGeneratingQuiz ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 text-primary" />
          )}
          <span className="text-xs">Quiz</span>
        </Button>

        <Button
          onClick={handleFlashcardsClick}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
        >
          {isGeneratingFlashcards ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4 text-secondary" />
          )}
          <span className="text-xs">Flashcards</span>
        </Button>

        <Button
          onClick={onGenerateSummary}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
        >
          {isGeneratingSummary ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 text-accent" />
          )}
          <span className="text-xs">Summary</span>
        </Button>

        <Button
          onClick={onGenerateMindMap}
          disabled={disabled || isAnyGenerating}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
        >
          {isGeneratingMindMap ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Network className="w-4 h-4 text-primary" />
          )}
          <span className="text-xs">Mind Map</span>
        </Button>
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
