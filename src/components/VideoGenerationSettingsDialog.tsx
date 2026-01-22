import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Brain, BookOpen, FileText, Network, Zap, List, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

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
  summaryFormat?: "concise" | "detailed" | "bullet-points" | "academic";
}

type SummaryFormat = "concise" | "detailed" | "bullet-points" | "academic";

const summaryFormats: { id: SummaryFormat; name: string; description: string; icon: React.ElementType }[] = [
  { id: "concise", name: "Concise Summary", description: "Brief overview of key points", icon: Zap },
  { id: "detailed", name: "Detailed Analysis", description: "In-depth coverage with examples", icon: FileText },
  { id: "bullet-points", name: "Bullet Points", description: "Easy-to-scan list format", icon: List },
  { id: "academic", name: "Academic Style", description: "Formal structure with citations", icon: GraduationCap },
];

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
  const [summaryFormat, setSummaryFormat] = useState<SummaryFormat>("concise");

  const handleGenerate = () => {
    onGenerate({
      count,
      difficulty: difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard",
      detailLevel: detailLevel === 1 ? "brief" : detailLevel === 2 ? "standard" : "detailed",
      summaryFormat: type === "summary" ? summaryFormat : undefined
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

          {/* Summary Format Selection - Only for Summary */}
          {type === "summary" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Summary Format</Label>
              <div className="grid grid-cols-2 gap-3">
                {summaryFormats.map((format) => {
                  const FormatIcon = format.icon;
                  return (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => setSummaryFormat(format.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all hover:shadow-md",
                        summaryFormat === format.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          summaryFormat === format.id ? "bg-primary/20" : "bg-muted"
                        )}>
                          <FormatIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{format.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{format.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
