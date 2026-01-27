import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Brain, 
  BookOpen, 
  FileText, 
  Network,
  Loader2,
  Sparkles
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "./UniversalStudySettingsDialog";

type ToolType = "quiz" | "flashcards" | "summary" | "mindmap";

interface MobileTextSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
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

export const MobileTextSelectionDrawer = ({
  open,
  onOpenChange,
  selectedText,
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
}: MobileTextSelectionDrawerProps) => {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pendingToolType, setPendingToolType] = useState<ToolType | null>(null);
  // Store selected text at the time of clicking to prevent closure issues
  const capturedTextRef = useRef<string>("");
  
  const isAnyLoading = isGeneratingQuiz || isGeneratingFlashcards || isGeneratingSummary || isGeneratingMindMap || isSearching;

  const handleToolClick = useCallback((toolType: ToolType) => {
    // Capture the current selected text before opening dialog
    capturedTextRef.current = selectedText;
    setPendingToolType(toolType);
    setSettingsDialogOpen(true);
  }, [selectedText]);

  const handleGenerateWithSettings = useCallback((settings: UniversalGenerationSettings) => {
    if (!pendingToolType) return;
    
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
    onOpenChange(false);
  }, [pendingToolType, onGenerateQuiz, onGenerateFlashcards, onGenerateSummary, onGenerateMindMap, onOpenChange]);

  const handleSearchVideos = useCallback(() => {
    onSearchVideos();
    onOpenChange(false);
  }, [onSearchVideos, onOpenChange]);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              Use Selected Text
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-6 space-y-4">
            {/* Selected text preview */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Selected:</p>
              <p className="text-sm font-medium line-clamp-3">{selectedText}</p>
            </div>

            {/* Tool buttons */}
            <div className="grid grid-cols-5 gap-2">
              <Button 
                onClick={handleSearchVideos}
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-2"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Search className="w-5 h-5 text-primary" />
                )}
                <span className="text-[10px]">Videos</span>
              </Button>

              <Button 
                onClick={() => handleToolClick("quiz")}
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-2"
              >
                {isGeneratingQuiz ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Brain className="w-5 h-5 text-primary" />
                )}
                <span className="text-[10px]">Quiz</span>
              </Button>

              <Button 
                onClick={() => handleToolClick("flashcards")}
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-2"
              >
                {isGeneratingFlashcards ? (
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                ) : (
                  <BookOpen className="w-5 h-5 text-violet-500" />
                )}
                <span className="text-[10px]">Flashcards</span>
              </Button>

              <Button 
                onClick={() => handleToolClick("summary")}
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-2"
              >
                {isGeneratingSummary ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                ) : (
                  <FileText className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-[10px]">Notes</span>
              </Button>

              <Button 
                onClick={() => handleToolClick("mindmap")}
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-2"
              >
                {isGeneratingMindMap ? (
                  <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                ) : (
                  <Network className="w-5 h-5 text-rose-500" />
                )}
                <span className="text-[10px]">Map</span>
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      
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
