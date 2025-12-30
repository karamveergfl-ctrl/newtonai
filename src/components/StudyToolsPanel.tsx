import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Network, 
  Loader2,
  X,
  Sparkles
} from "lucide-react";
import DOMPurify from "dompurify";

interface StudyToolsPanelProps {
  onGenerateQuiz: () => void;
  onGenerateFlashcards: () => void;
  onGenerateSummary: () => void;
  onGenerateMindMap: () => void;
  isGeneratingQuiz: boolean;
  isGeneratingFlashcards: boolean;
  isGeneratingSummary: boolean;
  isGeneratingMindMap: boolean;
  disabled?: boolean;
  summary?: string;
  mindMap?: string;
  onCloseSummary?: () => void;
  onCloseMindMap?: () => void;
}

export const StudyToolsPanel = ({
  onGenerateQuiz,
  onGenerateFlashcards,
  onGenerateSummary,
  onGenerateMindMap,
  isGeneratingQuiz,
  isGeneratingFlashcards,
  isGeneratingSummary,
  isGeneratingMindMap,
  disabled,
  summary,
  mindMap,
  onCloseSummary,
  onCloseMindMap,
}: StudyToolsPanelProps) => {
  const isAnyGenerating = isGeneratingQuiz || isGeneratingFlashcards || isGeneratingSummary || isGeneratingMindMap;

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-l">
      {/* Header */}
      <div className="p-3 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Study Tools</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Generate study materials from your document
        </p>
      </div>

      {/* Tools Grid */}
      <div className="p-3 border-b">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onGenerateQuiz}
            disabled={disabled || isAnyGenerating}
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/50"
          >
            {isGeneratingQuiz ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Brain className="w-5 h-5 text-primary" />
            )}
            <span className="text-xs">Quiz</span>
          </Button>

          <Button
            onClick={onGenerateFlashcards}
            disabled={disabled || isAnyGenerating}
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-secondary/10 hover:border-secondary/50"
          >
            {isGeneratingFlashcards ? (
              <Loader2 className="w-5 h-5 animate-spin text-secondary" />
            ) : (
              <BookOpen className="w-5 h-5 text-secondary" />
            )}
            <span className="text-xs">Flashcards</span>
          </Button>

          <Button
            onClick={onGenerateSummary}
            disabled={disabled || isAnyGenerating}
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-accent/10 hover:border-accent/50"
          >
            {isGeneratingSummary ? (
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            ) : (
              <FileText className="w-5 h-5 text-accent" />
            )}
            <span className="text-xs">Summary</span>
          </Button>

          <Button
            onClick={onGenerateMindMap}
            disabled={disabled || isAnyGenerating}
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/50"
          >
            {isGeneratingMindMap ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Network className="w-5 h-5 text-primary" />
            )}
            <span className="text-xs">Mind Map</span>
          </Button>
        </div>
      </div>

      {/* Generated Content Display */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Summary Display */}
          {summary && (
            <Card className="p-3 bg-accent/5 border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <h3 className="font-medium text-sm">Summary</h3>
                </div>
                {onCloseSummary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCloseSummary}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {summary}
              </div>
            </Card>
          )}

          {/* Mind Map Display */}
          {mindMap && (
            <Card className="p-3 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-sm">Mind Map</h3>
                </div>
                {onCloseMindMap && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCloseMindMap}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div 
                className="text-xs font-mono whitespace-pre leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(mindMap, {
                    ALLOWED_TAGS: ['br', 'b', 'i', 'em', 'strong', 'p', 'div', 'span', 'ul', 'ol', 'li'],
                    ALLOWED_ATTR: ['class', 'style']
                  })
                }}
              />
            </Card>
          )}

          {/* Empty State */}
          {!summary && !mindMap && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">
                Select a tool above to generate study materials
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
