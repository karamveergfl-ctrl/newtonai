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
  Coins,
  Podcast
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURE_COSTS } from "@/lib/creditConfig";
import { useCredits } from "@/hooks/useCredits";

interface PDFStudyToolsBarProps {
  onGenerateQuiz: () => void;
  onGenerateFlashcards: () => void;
  onGeneratePodcast: () => void;
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
  onGeneratePodcast,
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
      <span className="text-xs font-medium text-muted-foreground mr-2 whitespace-nowrap">
        Study Tools:
      </span>
      
      {/* Quiz */}
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

      {/* Flashcards */}
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
          <BookOpen className="w-4 h-4 text-violet-500" />
        )}
        <span className="text-xs">Flashcards</span>
        <CreditBadge feature="flashcards" />
      </Button>

      {/* Podcast */}
      <Button
        onClick={onGeneratePodcast}
        disabled={disabled || isGenerating}
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 shrink-0"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Podcast className="w-4 h-4 text-emerald-500" />
        )}
        <span className="text-xs">Podcast</span>
        <CreditBadge feature="podcast" />
      </Button>

      {/* Notes (was Summary) */}
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
          <FileText className="w-4 h-4 text-amber-500" />
        )}
        <span className="text-xs">Notes</span>
        <CreditBadge feature="summary" />
      </Button>

      {/* Mind Map */}
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
          <Network className="w-4 h-4 text-rose-500" />
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
