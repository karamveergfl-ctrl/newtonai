import { Button } from "@/components/ui/button";
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Network, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyToolsBarProps {
  onGenerateQuiz: () => void;
  onGenerateFlashcards: () => void;
  onGenerateSummary: () => void;
  onGenerateMindMap: () => void;
  isGeneratingQuiz: boolean;
  isGeneratingFlashcards: boolean;
  isGeneratingSummary: boolean;
  isGeneratingMindMap: boolean;
  disabled?: boolean;
  className?: string;
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
}: StudyToolsBarProps) => {
  const isAnyGenerating = isGeneratingQuiz || isGeneratingFlashcards || isGeneratingSummary || isGeneratingMindMap;

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-card/50 border-b", className)}>
      <span className="text-xs font-medium text-muted-foreground mr-2">Study Tools:</span>
      
      <Button
        onClick={onGenerateQuiz}
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
        onClick={onGenerateFlashcards}
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
  );
};
