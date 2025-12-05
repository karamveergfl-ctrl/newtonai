import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Brain, Loader2, ChevronDown } from "lucide-react";

interface StudyModeSelectorProps {
  onGenerateFlashcards: () => void;
  onGenerateQuiz: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const StudyModeSelector = ({
  onGenerateFlashcards,
  onGenerateQuiz,
  isGenerating,
  disabled
}: StudyModeSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-8"
          disabled={isGenerating || disabled}
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
          ) : (
            <Brain className="w-3 h-3 md:w-4 md:h-4" />
          )}
          <span className="hidden sm:inline text-xs">Study</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onGenerateFlashcards} className="gap-2">
          <BookOpen className="w-4 h-4" />
          Generate Flashcards
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGenerateQuiz} className="gap-2">
          <Brain className="w-4 h-4" />
          Take a Quiz
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
