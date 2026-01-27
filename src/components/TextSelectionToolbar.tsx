import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  X, 
  Search, 
  Brain, 
  BookOpen, 
  FileText, 
  Network,
  Loader2,
  Sparkles
} from "lucide-react";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "./UniversalStudySettingsDialog";

type ToolType = "quiz" | "flashcards" | "summary" | "mindmap";

interface TextSelectionToolbarProps {
  selectedText: string;
  onDismiss: () => void;
  onSearchVideos: () => void;
  onGenerateQuiz: (settings?: UniversalGenerationSettings) => void;
  onGenerateFlashcards: (settings?: UniversalGenerationSettings) => void;
  onGenerateSummary: (settings?: UniversalGenerationSettings) => void;
  onGenerateMindMap: (settings?: UniversalGenerationSettings) => void;
  isGeneratingQuiz?: boolean;
  isGeneratingFlashcards?: boolean;
  isGeneratingSummary?: boolean;
  isGeneratingMindMap?: boolean;
  isSearching?: boolean;
}

export const TextSelectionToolbar = ({
  selectedText,
  onDismiss,
  onSearchVideos,
  onGenerateQuiz,
  onGenerateFlashcards,
  onGenerateSummary,
  onGenerateMindMap,
  isGeneratingQuiz = false,
  isGeneratingFlashcards = false,
  isGeneratingSummary = false,
  isGeneratingMindMap = false,
  isSearching = false,
}: TextSelectionToolbarProps) => {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pendingToolType, setPendingToolType] = useState<ToolType | null>(null);
  // Store selected text at the time of clicking to prevent closure issues
  const capturedTextRef = useRef<string>("");
  
  const isAnyLoading = isGeneratingQuiz || isGeneratingFlashcards || isGeneratingSummary || isGeneratingMindMap || isSearching;

  const handleToolClick = useCallback((e: React.MouseEvent, toolType: ToolType) => {
    e.preventDefault();
    e.stopPropagation();
    // Capture the current selected text before opening dialog
    capturedTextRef.current = selectedText;
    setPendingToolType(toolType);
    setSettingsDialogOpen(true);
  }, [selectedText]);

  const handleSearchClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSearchVideos();
    onDismiss();
  }, [onSearchVideos, onDismiss]);

  const handleGenerateWithSettings = useCallback((settings: UniversalGenerationSettings) => {
    if (!pendingToolType) return;
    
    // Use the captured text from when the tool was clicked
    const textToUse = capturedTextRef.current || selectedText;
    
    switch (pendingToolType) {
      case "quiz":
        onGenerateQuiz(settings);
        break;
      case "flashcards":
        onGenerateFlashcards(settings);
        break;
      case "summary":
        onGenerateSummary(settings);
        break;
      case "mindmap":
        onGenerateMindMap(settings);
        break;
    }
    
    setPendingToolType(null);
    capturedTextRef.current = "";
    onDismiss();
  }, [pendingToolType, selectedText, onGenerateQuiz, onGenerateFlashcards, onGenerateSummary, onGenerateMindMap, onDismiss]);

  const handleDismissClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDismiss();
  }, [onDismiss]);

  return (
    <>
      <Card 
        className="p-3 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-fade-in max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          {/* Header with selected text */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <p className="text-xs text-muted-foreground">Selected text:</p>
              </div>
              <p className="text-sm font-medium line-clamp-2 break-words text-foreground/90">{selectedText}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissClick}
              className="h-6 w-6 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Tool buttons grid */}
          <div className="grid grid-cols-5 gap-1.5">
            <Button 
              onClick={handleSearchClick}
              variant="outline"
              size="sm"
              disabled={isAnyLoading}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-primary/10 hover:border-primary/50"
              title="Find Videos"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <Search className="w-4 h-4 text-primary" />
              )}
              <span className="text-[10px] leading-tight">Videos</span>
            </Button>

            <Button 
              onClick={(e) => handleToolClick(e, "quiz")}
              variant="outline"
              size="sm"
              disabled={isAnyLoading}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-primary/10 hover:border-primary/50"
              title="Generate Quiz"
            >
              {isGeneratingQuiz ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <Brain className="w-4 h-4 text-primary" />
              )}
              <span className="text-[10px] leading-tight">Quiz</span>
            </Button>

            <Button 
              onClick={(e) => handleToolClick(e, "flashcards")}
              variant="outline"
              size="sm"
              disabled={isAnyLoading}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-violet-500/10 hover:border-violet-500/50"
              title="Generate Flashcards"
            >
              {isGeneratingFlashcards ? (
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              ) : (
                <BookOpen className="w-4 h-4 text-violet-500" />
              )}
              <span className="text-[10px] leading-tight">Flashcards</span>
            </Button>

            <Button 
              onClick={(e) => handleToolClick(e, "summary")}
              variant="outline"
              size="sm"
              disabled={isAnyLoading}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-amber-500/10 hover:border-amber-500/50"
              title="Generate Notes"
            >
              {isGeneratingSummary ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <FileText className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-[10px] leading-tight">Notes</span>
            </Button>

            <Button 
              onClick={(e) => handleToolClick(e, "mindmap")}
              variant="outline"
              size="sm"
              disabled={isAnyLoading}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-rose-500/10 hover:border-rose-500/50"
              title="Generate Mind Map"
            >
              {isGeneratingMindMap ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <Network className="w-4 h-4 text-rose-500" />
              )}
              <span className="text-[10px] leading-tight">Map</span>
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Settings Dialog */}
      {pendingToolType && (
        <UniversalStudySettingsDialog
          open={settingsDialogOpen}
          onOpenChange={(open) => {
            setSettingsDialogOpen(open);
            if (!open) {
              setPendingToolType(null);
              capturedTextRef.current = "";
            }
          }}
          type={pendingToolType}
          contentTitle={selectedText.slice(0, 50) + (selectedText.length > 50 ? "..." : "")}
          contentType="text"
          onGenerate={handleGenerateWithSettings}
        />
      )}
    </>
  );
};
