import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizReviewModeProps {
  questions: Question[];
  answers: (number | null)[];
  score: number;
  onRetryAll: () => void;
  onRetryWrong: () => void;
  onClose: () => void;
}

export const QuizReviewMode = ({
  questions,
  answers,
  score,
  onRetryAll,
  onRetryWrong,
  onClose
}: QuizReviewModeProps) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set([0]));
  const [viewMode, setViewMode] = useState<"single" | "all">("single");

  const wrongAnswers = questions.filter((_, i) => 
    answers[i] !== null && answers[i] !== -1 && answers[i] !== questions[i].correctIndex
  );
  const skippedAnswers = questions.filter((_, i) => answers[i] === -1);
  const correctAnswers = questions.filter((_, i) => answers[i] === questions[i].correctIndex);

  const currentQuestion = questions[currentReviewIndex];
  const userAnswer = answers[currentReviewIndex];
  const isCorrect = userAnswer === currentQuestion?.correctIndex;
  const isSkipped = userAnswer === -1;

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const renderQuestionCard = (question: Question, index: number, isExpanded: boolean) => {
    const userAns = answers[index];
    const correct = userAns === question.correctIndex;
    const skipped = userAns === -1;
    const letter = (i: number) => String.fromCharCode(65 + i);

    return (
      <Card 
        key={question.id} 
        className={cn(
          "border-2 transition-all",
          correct 
            ? "border-green-500/30 bg-green-50/50 dark:bg-green-900/10" 
            : skipped
            ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10"
            : "border-red-500/30 bg-red-50/50 dark:bg-red-900/10"
        )}
      >
        <button 
          onClick={() => toggleExpanded(index)}
          className="w-full text-left p-4 flex items-start gap-3"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
            correct 
              ? "bg-green-500 text-white" 
              : skipped
              ? "bg-amber-500 text-white"
              : "bg-red-500 text-white"
          )}>
            {correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
              {correct && <span className="text-xs font-medium text-green-600 dark:text-green-400">Correct</span>}
              {skipped && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Skipped</span>}
              {!correct && !skipped && <span className="text-xs font-medium text-red-600 dark:text-red-400">Incorrect</span>}
            </div>
            <p className="font-medium text-sm line-clamp-2">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {question.question}
              </ReactMarkdown>
            </p>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 pb-4 px-4 space-y-3">
                {/* Options */}
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => {
                    const isUserAnswer = userAns === optIndex;
                    const isCorrectOption = optIndex === question.correctIndex;
                    
                    return (
                      <div
                        key={optIndex}
                        className={cn(
                          "p-3 rounded-lg border-2 flex items-start gap-3",
                          isCorrectOption
                            ? "border-green-500 bg-green-100/50 dark:bg-green-900/20"
                            : isUserAnswer
                            ? "border-red-500 bg-red-100/50 dark:bg-red-900/20"
                            : "border-transparent bg-muted/30"
                        )}
                      >
                        <span className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                          isCorrectOption
                            ? "bg-green-600 text-white"
                            : isUserAnswer
                            ? "bg-red-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {letter(optIndex)}
                        </span>
                        <span className="flex-1 text-sm pt-0.5">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {option}
                          </ReactMarkdown>
                        </span>
                        {isCorrectOption && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                        {isUserAnswer && !isCorrectOption && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
                
                {/* Explanation */}
                <div className="bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-3 border border-yellow-200/50 dark:border-yellow-800/50">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Explanation</p>
                      <p className="text-xs text-muted-foreground">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card/50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Quiz Review</h2>
            <Button onClick={onClose} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Results</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          
          {/* Stats summary */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>{correctAnswers.length} correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>{wrongAnswers.length} wrong</span>
            </div>
            {skippedAnswers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>{skippedAnswers.length} skipped</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="p-3 border-b bg-muted/30">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Button
            variant={viewMode === "single" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("single")}
            className="flex-1 sm:flex-none"
          >
            One at a time
          </Button>
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("all")}
            className="flex-1 sm:flex-none"
          >
            View all
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {viewMode === "single" ? (
            <>
              {/* Progress for single view */}
              <div className="flex items-center gap-3 mb-4">
                <Progress value={((currentReviewIndex + 1) / questions.length) * 100} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground">{currentReviewIndex + 1}/{questions.length}</span>
              </div>
              
              {renderQuestionCard(currentQuestion, currentReviewIndex, true)}
              
              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentReviewIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentReviewIndex === 0}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentReviewIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentReviewIndex === questions.length - 1}
                  className="flex-1 h-12"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            questions.map((q, i) => renderQuestionCard(q, i, expandedQuestions.has(i)))
          )}
        </div>
      </div>

      {/* Footer with retry options */}
      <div className="p-4 border-t bg-card/50 safe-area-pb">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <Button onClick={onRetryAll} variant="outline" className="h-12 gap-2 flex-1">
            <RotateCcw className="w-4 h-4" />
            Retry All
          </Button>
          {wrongAnswers.length > 0 && (
            <Button onClick={onRetryWrong} className="h-12 gap-2 flex-1">
              <Play className="w-4 h-4" />
              Retry Wrong ({wrongAnswers.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
