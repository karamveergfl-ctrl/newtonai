import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface TrueFalseQuestionProps {
  question: string;
  correctAnswer: boolean;
  selectedAnswer: boolean | null;
  showResult: boolean;
  onSelect: (value: boolean) => void;
}

export const TrueFalseQuestion = ({
  question,
  correctAnswer,
  selectedAnswer,
  showResult,
  onSelect,
}: TrueFalseQuestionProps) => {
  const options = [
    { value: true, label: "True" },
    { value: false, label: "False" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {options.map(({ value, label }) => {
          const isSelected = selectedAnswer === value;
          const isCorrect = value === correctAnswer;

          let styles = "bg-card hover:bg-muted/50 border-border";
          if (showResult) {
            if (isCorrect) {
              styles = "bg-accent/10 border-accent dark:bg-accent/20";
            } else if (isSelected && !isCorrect) {
              styles = "bg-destructive/10 border-destructive dark:bg-destructive/20";
            }
          } else if (isSelected) {
            styles = "bg-primary/5 border-primary";
          }

          return (
            <motion.button
              key={label}
              whileHover={{ scale: showResult ? 1 : 1.02 }}
              whileTap={{ scale: showResult ? 1 : 0.98 }}
              onClick={() => !showResult && onSelect(value)}
              disabled={showResult}
              className={cn(
                "p-6 sm:p-8 rounded-xl border-2 text-center transition-all font-bold text-lg sm:text-xl",
                styles,
                !showResult && "cursor-pointer hover:shadow-md"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                {showResult && isCorrect && <CheckCircle className="w-6 h-6 text-accent-foreground" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-destructive" />}
                {label}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
