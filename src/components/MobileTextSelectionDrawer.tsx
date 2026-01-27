import { useState } from "react";
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
  
  const isAnyLoading = isGeneratingQuiz || isGeneratingFlashcards || isGeneratingSummary || isGeneratingMindMap || isSearching;

  const handleToolClick = (toolType: ToolType) => {
    setPendingToolType(toolType);
    setSettingsDialogOpen(true);
  };

  const handleGenerateWithSettings = (settings: UniversalGenerationSettings) => {
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
    onOpenChange(false);
  };

  const handleSearchVideos = () => {
    onSearchVideos();
    onOpenChange(false);
  };

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
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Selected:</p>
              <p className="text-sm font-medium line-clamp-3">{selectedText}</p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleSearchVideos}
                disabled={isAnyLoading}
                variant="default"
                className="flex items-center gap-2 h-12"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Find Videos
              </Button>

              <Button
                onClick={() => handleToolClick("quiz")}
                disabled={isAnyLoading}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                {isGeneratingQuiz ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Brain className="w-5 h-5 text-primary" />
                )}
                Quiz
              </Button>

              <Button
                onClick={() => handleToolClick("flashcards")}
                disabled={isAnyLoading}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                {isGeneratingFlashcards ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <BookOpen className="w-5 h-5 text-secondary" />
                )}
                Flashcards
              </Button>

              <Button
                onClick={() => handleToolClick("summary")}
                disabled={isAnyLoading}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                {isGeneratingSummary ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 text-accent" />
                )}
                Summary
              </Button>

              <Button
                onClick={() => handleToolClick("mindmap")}
                disabled={isAnyLoading}
                variant="outline"
                className="flex items-center gap-2 h-12 col-span-2"
              >
                {isGeneratingMindMap ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Network className="w-5 h-5 text-primary" />
                )}
                Mind Map
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
            if (!open) setPendingToolType(null);
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
