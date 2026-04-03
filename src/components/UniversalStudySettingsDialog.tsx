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
import { Switch } from "@/components/ui/switch";
import { Brain, BookOpen, FileText, Network, Circle, GitBranch, Boxes, Clock, Zap, List, GraduationCap, Table2, Sparkles, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { SubscriptionTierBadge } from "@/components/SubscriptionTierBadge";
import { AssignToClassSelect } from "@/components/AssignToClassSelect";

export type QuizQuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer" | "match";

export interface UniversalGenerationSettings {
  pageStart?: number;
  pageEnd?: number;
  count: number;
  difficulty: "easy" | "medium" | "hard" | "adaptive";
  detailLevel: "brief" | "standard" | "detailed";
  mindMapStyle?: "radial" | "tree" | "cluster" | "timeline";
  summaryFormat?: "concise" | "detailed" | "bullet-points" | "academic";
  includeComparison?: boolean;
  classId?: string;
  questionTypes?: QuizQuestionType[];
  includeExplanations?: boolean;
}

interface UniversalStudySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "quiz" | "flashcards" | "summary" | "mindmap";
  contentTitle?: string;
  contentType?: "video" | "pdf" | "text" | "image" | "recording";
  totalPages?: number;
  onGenerate: (settings: UniversalGenerationSettings) => void;
}

type MindMapStyle = "radial" | "tree" | "cluster" | "timeline";
type SummaryFormat = "concise" | "detailed" | "bullet-points" | "academic";

const mindMapStyles: { id: MindMapStyle; name: string; description: string; icon: React.ElementType }[] = [
  { id: "radial", name: "Radial", description: "Central topic with radiating branches", icon: Circle },
  { id: "tree", name: "Tree", description: "Hierarchical top-down structure", icon: GitBranch },
  { id: "cluster", name: "Cluster", description: "Grouped concepts by category", icon: Boxes },
  { id: "timeline", name: "Timeline", description: "Sequential flow of events", icon: Clock },
];

const summaryFormats: { id: SummaryFormat; name: string; description: string; icon: React.ElementType }[] = [
  { id: "concise", name: "Concise Summary", description: "Brief overview of key points", icon: Zap },
  { id: "detailed", name: "Detailed Analysis", description: "In-depth coverage with examples", icon: FileText },
  { id: "bullet-points", name: "Bullet Points", description: "Easy-to-scan list format", icon: List },
  { id: "academic", name: "Academic Style", description: "Formal structure with citations", icon: GraduationCap },
];

// Base config - countMax will be overridden based on subscription
const typeConfigBase = {
  quiz: {
    icon: Brain,
    label: "Quiz",
    description: "Generate quiz questions to test your understanding",
    color: "text-primary",
    countLabel: "Number of Questions",
    countMin: 5,
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
    countDefault: 10,
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
    countDefault: 0,
    showDifficulty: false,
    showDetailLevel: false,
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
  const { subscription } = useFeatureUsage();
  const baseConfig = typeConfigBase[type];
  const Icon = baseConfig.icon;
  
  // Dynamic max count based on subscription tier
  const isFree = subscription.tier === "free";
  const maxCount = (type === "quiz" || type === "flashcards") ? (isFree ? 10 : 20) : 0;

  const [pageRange, setPageRange] = useState<[number, number]>([1, totalPages]);
  const [count, setCount] = useState(Math.min(baseConfig.countDefault, maxCount || baseConfig.countDefault));
  const [difficulty, setDifficulty] = useState(1); // 0=easy, 1=medium, 2=hard
  const [detailLevel, setDetailLevel] = useState(1); // 0=brief, 1=standard, 2=detailed
  const [mindMapStyle, setMindMapStyle] = useState<MindMapStyle>("radial");
  const [summaryFormat, setSummaryFormat] = useState<SummaryFormat>("concise");
  const [includeComparison, setIncludeComparison] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState("none");
  const handleGenerate = () => {
    const settings: UniversalGenerationSettings = {
      count,
      difficulty: ["easy", "medium", "hard"][difficulty] as "easy" | "medium" | "hard",
      detailLevel: ["brief", "standard", "detailed"][detailLevel] as "brief" | "standard" | "detailed",
      mindMapStyle: type === "mindmap" ? mindMapStyle : undefined,
      summaryFormat: type === "summary" ? summaryFormat : undefined,
      includeComparison: type === "summary" ? includeComparison : undefined,
      classId: selectedClassId !== "none" ? selectedClassId : undefined,
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
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg bg-primary/10", baseConfig.color)}>
                <Icon className="h-5 w-5" />
              </div>
              Generate {baseConfig.label}
            </DialogTitle>
            <SubscriptionTierBadge tier={subscription.tier} size="sm" />
          </div>
          <DialogDescription>{baseConfig.description}</DialogDescription>
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
          {maxCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{baseConfig.countLabel}</Label>
                <span className="text-sm font-semibold text-primary">{count}</span>
              </div>
              <Slider
                value={[count]}
                onValueChange={([value]) => setCount(value)}
                min={baseConfig.countMin}
                max={maxCount}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{baseConfig.countMin}</span>
                <span>{maxCount}</span>
              </div>
              {isFree && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span><span className="text-primary font-medium">Upgrade to Pro</span> for up to 20 {type === "quiz" ? "questions" : "flashcards"}</span>
                </p>
              )}
            </div>
          )}

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

          {/* Mind Map Style Selection - Only for Mind Map */}
          {type === "mindmap" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Mind Map Style</Label>
              <div className="grid grid-cols-2 gap-3">
                {mindMapStyles.map((style) => {
                  const StyleIcon = style.icon;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setMindMapStyle(style.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all hover:shadow-md",
                        mindMapStyle === style.id
                          ? "border-rose-500 bg-rose-500/5"
                          : "border-border hover:border-rose-500/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          mindMapStyle === style.id ? "bg-rose-500/20" : "bg-muted"
                        )}>
                          <StyleIcon className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{style.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comparison Table Toggle - For Summary */}
          {type === "summary" && (
            <div className="flex items-center justify-between py-2 px-1 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Auto-generate Comparison Tables</Label>
                  <p className="text-xs text-muted-foreground">Creates tables when comparing concepts</p>
                </div>
              </div>
              <Switch
                checked={includeComparison}
                onCheckedChange={setIncludeComparison}
              />
            </div>
          )}

          {/* Difficulty Slider - For Quiz and Flashcards */}
          {baseConfig.showDifficulty && (
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
          {baseConfig.showDetailLevel && (
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

          {/* Assign to Class - Only for quiz and only for teachers */}
          {type === "quiz" && (
            <AssignToClassSelect
              selectedClassId={selectedClassId}
              onClassIdChange={setSelectedClassId}
            />
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
