import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Brain, BookOpen, Sparkles } from "lucide-react";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { SubscriptionTierBadge } from "@/components/SubscriptionTierBadge";
import { AssignToClassSelect } from "@/components/AssignToClassSelect";

interface GenerationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "quiz" | "flashcards";
  totalPages: number;
  onGenerate: (settings: GenerationSettings) => void;
}

export interface GenerationSettings {
  pageStart: number;
  pageEnd: number;
  count: number;
  difficulty: "easy" | "medium" | "hard";
  detailLevel?: "brief" | "standard" | "detailed";
  summaryFormat?: "concise" | "detailed" | "bullet-points" | "academic";
  includeComparison?: boolean;
  classId?: string;
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

export const GenerationSettingsDialog = ({
  open,
  onOpenChange,
  type,
  totalPages,
  onGenerate
}: GenerationSettingsDialogProps) => {
  const { subscription } = useFeatureUsage();
  
  // Dynamic max count based on subscription tier
  const isFree = subscription.tier === "free";
  const maxCount = isFree ? 10 : 20;
  const minCount = 5;
  
  const [pageRange, setPageRange] = useState<[number, number]>([1, Math.min(totalPages, 10)]);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState(2);
  const [selectedClassId, setSelectedClassId] = useState("none");

  const handleGenerate = () => {
    onGenerate({
      pageStart: pageRange[0],
      pageEnd: pageRange[1],
      count,
      difficulty: difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard",
      classId: selectedClassId !== "none" ? selectedClassId : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {type === "quiz" ? (
                <>
                  <Brain className="w-5 h-5 text-primary" />
                  Generate Quiz
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 text-secondary" />
                  Generate Flashcards
                </>
              )}
            </DialogTitle>
            <SubscriptionTierBadge tier={subscription.tier} size="sm" />
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Page Range */}
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
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>{totalPages}</span>
            </div>
          </div>

          {/* Number of Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Number of {type === "quiz" ? "Questions" : "Flashcards"}
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
            {isFree && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span><span className="text-primary font-medium">Upgrade to Pro</span> for up to 20 {type === "quiz" ? "questions" : "flashcards"}</span>
              </p>
            )}
          </div>

          {/* Difficulty Level */}
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

          {/* Assign to Class - Only for quiz and only for teachers */}
          {type === "quiz" && (
            <AssignToClassSelect
              selectedClassId={selectedClassId}
              onClassIdChange={setSelectedClassId}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="gap-2">
            {type === "quiz" ? <Brain className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
