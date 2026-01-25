import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Network, 
  Loader2,
  Search,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURE_COSTS } from "@/lib/creditConfig";
import { useCredits } from "@/hooks/useCredits";

interface PDFStudyToolsBarProps {
  onGenerateQuiz: () => void;
  onGenerateFlashcards: () => void;
  onGenerateSummary: () => void;
  onGenerateMindMap: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  className?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function PDFStudyToolsBar({
  onGenerateQuiz,
  onGenerateFlashcards,
  onGenerateSummary,
  onGenerateMindMap,
  isGenerating,
  disabled,
  className,
  searchQuery,
  onSearchChange,
}: PDFStudyToolsBarProps) {
  const { isPremium } = useCredits();

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

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 bg-card/50 border-b overflow-x-auto scrollbar-hide",
      className
    )}>
      <span className="text-xs font-semibold text-primary uppercase tracking-wide mr-2 whitespace-nowrap">
        Tools
      </span>
      
      <Button
        onClick={onGenerateQuiz}
        disabled={disabled || isGenerating}
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 shrink-0"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Brain className="w-4 h-4 text-primary" />
        )}
        <span className="text-xs">Quiz</span>
        <CreditBadge feature="quiz" />
      </Button>

      <Button
        onClick={onGenerateFlashcards}
        disabled={disabled || isGenerating}
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 shrink-0"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <BookOpen className="w-4 h-4 text-secondary" />
        )}
        <span className="text-xs">Flashcards</span>
        <CreditBadge feature="flashcards" />
      </Button>

      <Button
        onClick={onGenerateSummary}
        disabled={disabled || isGenerating}
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 shrink-0"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 text-accent" />
        )}
        <span className="text-xs">Summary</span>
        <CreditBadge feature="summary" />
      </Button>

      <Button
        onClick={onGenerateMindMap}
        disabled={disabled || isGenerating}
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 shrink-0"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Network className="w-4 h-4 text-primary" />
        )}
        <span className="text-xs">Mind Map</span>
        <CreditBadge feature="mind_map" />
      </Button>

      {/* Search Input */}
      {onSearchChange && (
        <div className="relative ml-auto flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a topic"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-40 sm:w-48 pl-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}
