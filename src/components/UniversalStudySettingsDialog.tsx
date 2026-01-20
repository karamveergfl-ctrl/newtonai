import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Brain, BookOpen, FileText, Network, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UniversalGenerationSettings {
  pageStart?: number;
  pageEnd?: number;
  count: number;
  difficulty: "easy" | "medium" | "hard";
  detailLevel: "brief" | "standard" | "detailed";
}

interface UniversalStudySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "quiz" | "flashcards" | "summary" | "mindmap" | "notes";
  contentTitle?: string;
  contentType?: "video" | "pdf" | "text" | "image" | "recording";
  totalPages?: number;
  onGenerate: (settings: UniversalGenerationSettings) => void;
}

const typeConfig = {
  quiz: {
    icon: Brain,
    label: "Quiz",
    description: "Generate quiz questions to test your understanding",
    color: "text-primary",
    countLabel: "Number of Questions",
    countMin: 5,
    countMax: 30,
    countDefault: 10,
    showDifficulty: true,
    showDetailLevel: false,
  },
  flashcards: {
    icon: BookOpen,
    label: "Flashcards",
    description: "Create flashcards for memorization and review",
    color: "text-secondary",
    countLabel: "Number of Flashcards",
    countMin: 5,
    countMax: 50,
    countDefault: 15,
    showDifficulty: true,
    showDetailLevel: false,
  },
  summary: {
    icon: FileText,
    label: "Summary",
    description: "Generate a comprehensive study guide",
    color: "text-accent",
    countLabel: "",
    countMin: 0,
    countMax: 0,
    countDefault: 0,
    showDifficulty: false,
    showDetailLevel: true,
  },
  mindmap: {
    icon: Network,
    label: "Mind Map",
    description: "Create a visual mind map of concepts",
    color: "text-primary",
    countLabel: "",
    countMin: 0,
    countMax: 0,
    countDefault: 0,
    showDifficulty: false,
    showDetailLevel: true,
  },
  notes: {
    icon: Sparkles,
    label: "AI Notes",
    description: "Generate organized notes from your content",
    color: "text-primary",
    countLabel: "",
    countMin: 0,
    countMax: 0,
    countDefault: 0,
    showDifficulty: false,
    showDetailLevel: true,
  },
};

const difficultyLabels = ["Easy", "Medium", "Hard"];
const detailLevelLabels = ["Brief", "Standard", "Detailed"];

export const UniversalStudySettingsDialog = ({
  open,
  onOpenChange,
  type,
  contentTitle,
  contentType,
  totalPages = 1,
  onGenerate,
}: UniversalStudySettingsDialogProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  const [pageRange, setPageRange] = useState<[number, number]>([1, totalPages]);
  const [count, setCount] = useState(config.countDefault);
  const [difficulty, setDifficulty] = useState(1); // 0=easy, 1=medium, 2=hard
  const [detailLevel, setDetailLevel] = useState(1); // 0=brief, 1=standard, 2=detailed

  const handleGenerate = () => {
    const settings: UniversalGenerationSettings = {
      count,
      difficulty: ["easy", "medium", "hard"][difficulty] as "easy" | "medium" | "hard",
      detailLevel: ["brief", "standard", "detailed"][detailLevel] as "brief" | "standard" | "detailed",
    };

    if (totalPages > 1) {
      settings.pageStart = pageRange[0];
      settings.pageEnd = pageRange[1];
    }

    onGenerate(settings);
    onOpenChange(false);
  };

  const getContentTypeLabel = () => {
    if (!contentType) return "Content";
    const labels: Record<string, string> = {
      video: "Video",
      pdf: "Document",
      text: "Text",
      image: "Image",
      recording: "Recording",
    };
    return labels[contentType] || "Content";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg bg-primary/10", config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            Generate {config.label}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Preview */}
          {contentTitle && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{getContentTypeLabel()}</p>
              <p className="text-sm font-medium line-clamp-2">{contentTitle}</p>
            </div>
          )}

          {/* Page Range Slider - Only for PDFs with multiple pages */}
          {totalPages > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Page Range</Label>
                <span className="text-sm text-muted-foreground">
                  Pages {pageRange[0]} - {pageRange[1]} of {totalPages}
                </span>
              </div>
              <Slider
                value={pageRange}
                onValueChange={(value) => setPageRange(value as [number, number])}
                min={1}
                max={totalPages}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Count Slider - For Quiz and Flashcards */}
          {config.countMax > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{config.countLabel}</Label>
                <span className="text-sm font-semibold text-primary">{count}</span>
              </div>
              <Slider
                value={[count]}
                onValueChange={([value]) => setCount(value)}
                min={config.countMin}
                max={config.countMax}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{config.countMin}</span>
                <span>{config.countMax}</span>
              </div>
            </div>
          )}

          {/* Difficulty Slider - For Quiz and Flashcards */}
          {config.showDifficulty && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Difficulty</Label>
                <span className={cn(
                  "text-sm font-semibold px-2 py-0.5 rounded",
                  difficulty === 0 && "bg-green-500/20 text-green-600 dark:text-green-400",
                  difficulty === 1 && "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
                  difficulty === 2 && "bg-red-500/20 text-red-600 dark:text-red-400"
                )}>
                  {difficultyLabels[difficulty]}
                </span>
              </div>
              <Slider
                value={[difficulty]}
                onValueChange={([value]) => setDifficulty(value)}
                min={0}
                max={2}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>
          )}

          {/* Detail Level Slider - For Summary and Mind Map */}
          {config.showDetailLevel && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Detail Level</Label>
                <span className={cn(
                  "text-sm font-semibold px-2 py-0.5 rounded",
                  detailLevel === 0 && "bg-blue-500/20 text-blue-600 dark:text-blue-400",
                  detailLevel === 1 && "bg-purple-500/20 text-purple-600 dark:text-purple-400",
                  detailLevel === 2 && "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                )}>
                  {detailLevelLabels[detailLevel]}
                </span>
              </div>
              <Slider
                value={[detailLevel]}
                onValueChange={([value]) => setDetailLevel(value)}
                min={0}
                max={2}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Brief</span>
                <span>Standard</span>
                <span>Detailed</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="gap-2">
            <Icon className="h-4 w-4" />
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
