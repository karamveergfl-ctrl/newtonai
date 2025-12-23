import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Brain, BookOpen, FileText, Network } from "lucide-react";

interface VideoGenerationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "quiz" | "flashcards" | "summary" | "mindmap";
  videoTitle: string;
  onGenerate: (settings: VideoGenerationSettings) => void;
}

export interface VideoGenerationSettings {
  count: number;
  difficulty: "easy" | "medium" | "hard";
  detailLevel?: "brief" | "standard" | "detailed";
}

const difficultyLabels = {
  1: "Easy",
  2: "Medium", 
  3: "Hard"
};

const difficultyColors = {
  1: "text-green-500",
  2: "text-yellow-500",
  3: "text-red-500"
};

const detailLabels = {
  1: "Brief",
  2: "Standard", 
  3: "Detailed"
};

const detailColors = {
  1: "text-blue-400",
  2: "text-blue-500",
  3: "text-blue-600"
};

const getIcon = (type: string) => {
  switch (type) {
    case "quiz":
      return <Brain className="w-5 h-5 text-primary" />;
    case "flashcards":
      return <BookOpen className="w-5 h-5 text-secondary" />;
    case "summary":
      return <FileText className="w-5 h-5 text-orange-500" />;
    case "mindmap":
      return <Network className="w-5 h-5 text-red-500" />;
    default:
      return <Brain className="w-5 h-5 text-primary" />;
  }
};

const getTitle = (type: string) => {
  switch (type) {
    case "quiz":
      return "Generate Quiz";
    case "flashcards":
      return "Generate Flashcards";
    case "summary":
      return "Generate Summary";
    case "mindmap":
      return "Generate Mind Map";
    default:
      return "Generate";
  }
};

export const VideoGenerationSettingsDialog = ({
  open,
  onOpenChange,
  type,
  videoTitle,
  onGenerate
}: VideoGenerationSettingsDialogProps) => {
  const [count, setCount] = useState(type === "quiz" ? 10 : type === "flashcards" ? 15 : 5);
  const [difficulty, setDifficulty] = useState(2);
  const [detailLevel, setDetailLevel] = useState(2);

  const handleGenerate = () => {
    onGenerate({
      count,
      difficulty: difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard",
      detailLevel: detailLevel === 1 ? "brief" : detailLevel === 2 ? "standard" : "detailed"
    });
    onOpenChange(false);
  };

  const showCountSlider = type === "quiz" || type === "flashcards";
  const showDifficultySlider = type === "quiz" || type === "flashcards";
  const showDetailSlider = type === "summary" || type === "mindmap";

  const maxCount = type === "quiz" ? 30 : 50;
  const minCount = 5;
  const countLabel = type === "quiz" ? "Questions" : "Flashcards";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon(type)}
            {getTitle(type)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Video Title */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Video</p>
            <p className="text-sm font-medium line-clamp-2">{videoTitle}</p>
          </div>

          {/* Number of Items - Only for Quiz and Flashcards */}
          {showCountSlider && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Number of {countLabel}
                </Label>
                <span className="text-sm font-semibold text-primary">{count}</span>
              </div>
              <Slider
                value={[count]}
                onValueChange={(value) => setCount(value[0])}
                min={minCount}
                max={maxCount}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{minCount}</span>
                <span>{maxCount}</span>
              </div>
            </div>
          )}

          {/* Difficulty Level - For Quiz and Flashcards */}
          {showDifficultySlider && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Difficulty Level</Label>
                <span className={`text-sm font-semibold ${difficultyColors[difficulty as keyof typeof difficultyColors]}`}>
                  {difficultyLabels[difficulty as keyof typeof difficultyLabels]}
                </span>
              </div>
              <Slider
                value={[difficulty]}
                onValueChange={(value) => setDifficulty(value[0])}
                min={1}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-green-500">Easy</span>
                <span className="text-yellow-500">Medium</span>
                <span className="text-red-500">Hard</span>
              </div>
            </div>
          )}

          {/* Detail Level - For Summary and Mind Map */}
          {showDetailSlider && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Detail Level</Label>
                <span className={`text-sm font-semibold ${detailColors[detailLevel as keyof typeof detailColors]}`}>
                  {detailLabels[detailLevel as keyof typeof detailLabels]}
                </span>
              </div>
              <Slider
                value={[detailLevel]}
                onValueChange={(value) => setDetailLevel(value[0])}
                min={1}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-blue-400">Brief</span>
                <span className="text-blue-500">Standard</span>
                <span className="text-blue-600">Detailed</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="gap-2">
            {getIcon(type)}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
