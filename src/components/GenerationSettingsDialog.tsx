import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Brain, BookOpen } from "lucide-react";

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
  const [pageRange, setPageRange] = useState<[number, number]>([1, Math.min(totalPages, 10)]);
  const [count, setCount] = useState(type === "quiz" ? 10 : 15);
  const [difficulty, setDifficulty] = useState(2);

  const handleGenerate = () => {
    onGenerate({
      pageStart: pageRange[0],
      pageEnd: pageRange[1],
      count,
      difficulty: difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard"
    });
    onOpenChange(false);
  };

  const maxCount = type === "quiz" ? 30 : 50;
  const minCount = type === "quiz" ? 5 : 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
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
