import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Download,
  Loader2,
  Brain,
  ArrowLeft,
  SkipForward,
  Lightbulb,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { motion } from "framer-motion";
import { useStudyContext } from "@/contexts/StudyContext";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizModeProps {
  questions: Question[];
  title: string;
  onClose: () => void;
  onComplete: (score: number, total: number, xpEarned: number) => void;
  isLoading?: boolean;
  loadingMessage?: string;
  initialQuestions?: Question[]; // For retry wrong feature
}

import { QuizReviewMode } from "@/components/QuizReviewMode";

export const QuizMode = ({ 
  questions, 
  title, 
  onClose, 
  onComplete,
  isLoading = false,
  loadingMessage = "Generating quiz questions...",
  initialQuestions
}: QuizModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isComplete, setIsComplete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [showReview, setShowReview] = useState(false);
  const [retryWrongQuestions, setRetryWrongQuestions] = useState<Question[] | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { setDeepStudy } = useStudyContext();

  // Set deep study mode when quiz is active
  useEffect(() => {
    setDeepStudy(true);
    return () => setDeepStudy(false);
  }, [setDeepStudy]);

  // Animate progress bar while loading
  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 30) return prev + 3;
          if (prev < 60) return prev + 2;
          if (prev < 85) return prev + 0.5;
          return prev;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isLoading]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isCorrect = currentQuestion ? selectedAnswer === currentQuestion.correctIndex : false;

  const downloadAsPDF = async () => {
    setIsDownloading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yOffset = 20;

      pdf.setFontSize(18);
      pdf.text(title, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 15;

      pdf.setFontSize(12);
      questions.forEach((q, idx) => {
        if (yOffset > 260) {
          pdf.addPage();
          yOffset = 20;
        }
        
        pdf.setFont(undefined, 'bold');
        const questionLines = pdf.splitTextToSize(`Q${idx + 1}: ${q.question}`, pageWidth - 30);
        pdf.text(questionLines, 15, yOffset);
        yOffset += questionLines.length * 6 + 5;

        pdf.setFont(undefined, 'normal');
        q.options.forEach((opt, oi) => {
          if (yOffset > 270) {
            pdf.addPage();
            yOffset = 20;
          }
          const prefix = oi === q.correctIndex ? '✓ ' : '  ';
          const optLines = pdf.splitTextToSize(`${prefix}${String.fromCharCode(65 + oi)}. ${opt}`, pageWidth - 40);
          pdf.text(optLines, 20, yOffset);
          yOffset += optLines.length * 5 + 2;
        });

        if (q.explanation) {
          if (yOffset > 260) {
            pdf.addPage();
            yOffset = 20;
          }
          pdf.setFontSize(10);
          pdf.setTextColor(100);
          const expLines = pdf.splitTextToSize(`Explanation: ${q.explanation}`, pageWidth - 35);
          pdf.text(expLines, 20, yOffset);
          pdf.setTextColor(0);
          pdf.setFontSize(12);
          yOffset += expLines.length * 4 + 10;
        }

        yOffset += 5;
      });

      pdf.save(`Quiz_${title.slice(0, 30)}.pdf`);
      toast({ title: "Downloaded", description: "Quiz PDF downloaded successfully" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);
    
    if (selectedAnswer === currentQuestion.correctIndex) {
      setScore(score + 1);
    }
    setShowResult(true);
  };

  const handleSkip = () => {
    setSkippedQuestions(prev => new Set(prev).add(currentIndex));
    const newAnswers = [...answers];
    newAnswers[currentIndex] = -1; // Mark as skipped
    setAnswers(newAnswers);
    setShowResult(true);
    setSelectedAnswer(null);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz complete
      const finalScore = score + (isCorrect ? 0 : 0); // Score already updated
      const xpEarned = Math.round((finalScore / questions.length) * 100) + 10; // Base 10 XP + bonus
      setIsComplete(true);
      onComplete(finalScore + (isCorrect ? 1 : 0), questions.length, xpEarned);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
    setIsComplete(false);
    setSkippedQuestions(new Set());
    setShowReview(false);
    setRetryWrongQuestions(null);
  };

  const handleRetryWrong = () => {
    const wrongQuestions = questions.filter((_, i) => 
      answers[i] !== null && answers[i] !== -1 && answers[i] !== questions[i].correctIndex
    );
    if (wrongQuestions.length > 0) {
      setRetryWrongQuestions(wrongQuestions);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setAnswers(new Array(wrongQuestions.length).fill(null));
      setIsComplete(false);
      setSkippedQuestions(new Set());
      setShowReview(false);
    }
  };

  const handleShowReview = () => {
    setShowReview(true);
  };

  // Use retry questions if available
  const activeQuestions = retryWrongQuestions || questions;

  const finalScore = score + (showResult && isCorrect ? 1 : 0);
  const percentage = Math.round((finalScore / questions.length) * 100);

  // Loading state with skeleton
  if (isLoading || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{title}</h2>
              <p className="text-sm text-muted-foreground">Generating quiz...</p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to PDF
            </Button>
          </div>
        </div>
        
        {/* Loading Progress */}
        <div className="px-4 py-3 bg-card border-b">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">{loadingMessage}</p>
              <Progress value={loadingProgress} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground w-10">{Math.round(loadingProgress)}%</span>
          </div>
        </div>
        
        {/* Skeleton Quiz Content */}
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Skeleton Question Card */}
            <div className="bg-card rounded-lg p-6 border shadow-sm relative overflow-hidden">
              <div className="space-y-3 animate-pulse">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-10 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-full" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Skeleton Options */}
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div 
                  key={index}
                  className="w-full p-4 rounded-lg border-2 border-transparent bg-card relative overflow-hidden animate-pulse"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animationDelay: `${index * 200}ms` }} />
                </div>
              ))}
            </div>
            
            {/* Loading message */}
            <div className="text-center space-y-2 pt-4">
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Creating your quiz</span>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Analyzing content and generating personalized questions...
              </p>
            </div>
          </div>
        </div>

        {/* Skeleton Footer */}
        <div className="p-4 border-t bg-card/50">
          <div className="max-w-2xl mx-auto flex justify-end">
            <div className="h-10 w-36 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Show review mode
  if (showReview) {
    return (
      <QuizReviewMode
        questions={activeQuestions}
        answers={answers}
        score={finalScore}
        onRetryAll={handleRetry}
        onRetryWrong={handleRetryWrong}
        onClose={() => setShowReview(false)}
      />
    );
  }

  if (isComplete) {
    const wrongCount = activeQuestions.filter((_, i) => 
      answers[i] !== null && answers[i] !== -1 && answers[i] !== activeQuestions[i].correctIndex
    ).length;

    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Confetti celebration */}
        <ConfettiCelebration isActive={isComplete} />
        
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          {/* Trophy with animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative inline-block"
          >
            <div className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center mx-auto",
              percentage >= 80 
                ? "bg-gradient-to-br from-yellow-400/20 to-amber-500/20" 
                : percentage >= 60 
                ? "bg-gradient-to-br from-gray-300/20 to-gray-400/20"
                : "bg-gradient-to-br from-orange-400/20 to-red-500/20"
            )}>
              <Trophy className={cn(
                "w-14 h-14",
                percentage >= 80 ? "text-yellow-500" : percentage >= 60 ? "text-gray-400" : "text-orange-600"
              )} />
            </div>
            <Sparkles className="absolute top-0 right-0 w-8 h-8 text-primary animate-pulse" />
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-bold">
            {percentage >= 80 ? "Excellent! 🎉" : percentage >= 60 ? "Good Job! 👍" : "Keep Learning! 📚"}
          </h2>
          
          <div className="space-y-2">
            <motion.p 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent"
            >
              {percentage}%
            </motion.p>
            <p className="text-muted-foreground">
              {finalScore}/{activeQuestions.length} correct
              {skippedQuestions.size > 0 && (
                <span className="block text-sm mt-1">
                  ({skippedQuestions.size} skipped)
                </span>
              )}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground mb-1">XP Earned</p>
            <p className="text-2xl font-bold text-primary">
              +{Math.round((finalScore / activeQuestions.length) * 100) + 10} XP
            </p>
          </div>

          <div className="flex flex-col gap-3 justify-center pt-2">
            {/* Review answers button */}
            <Button 
              onClick={handleShowReview} 
              variant="outline" 
              className="h-12 gap-2 w-full"
            >
              <Brain className="w-4 h-4" />
              Review All Answers
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleRetry} variant="outline" className="h-12 gap-2 flex-1">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
              {wrongCount > 0 && (
                <Button onClick={handleRetryWrong} variant="secondary" className="h-12 gap-2 flex-1">
                  <XCircle className="w-4 h-4" />
                  Retry Wrong ({wrongCount})
                </Button>
              )}
              <Button onClick={onClose} className="h-12 gap-2 flex-1">
                <CheckCircle className="w-4 h-4" />
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header - Compact on mobile */}
      <div className="shrink-0 p-2 md:p-4 border-b bg-card/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm md:text-lg truncate">{title}</h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Q {currentIndex + 1}/{questions.length}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Score</p>
              <p className="text-sm md:text-lg font-bold text-primary">{score}/{questions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button 
              onClick={downloadAsPDF} 
              variant="outline" 
              size="icon" 
              disabled={isDownloading}
              title="Download PDF"
              className="h-8 w-8 md:h-9 md:w-9"
            >
              {isDownloading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Download className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
            <Button onClick={onClose} variant="outline" size="sm" className="gap-1 h-8 md:h-9 text-xs md:text-sm px-2 md:px-3">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <Progress value={progress} className="h-1.5 md:h-2 [&>div]:transition-all [&>div]:duration-500" />
        </div>
      </div>

      {/* Question - Scrollable area with padding for fixed footer */}
      <div className="flex-1 overflow-auto p-2 md:p-4 pb-28 md:pb-24 bg-muted/30">
        <div className="max-w-3xl mx-auto space-y-3 md:space-y-6">
          {/* Question Card - Compact on mobile */}
          <div className="bg-card rounded-xl p-3 md:p-6 border border-border shadow-sm">
            <p className="text-sm md:text-xl font-semibold leading-snug">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1 md:mr-2">Question {currentIndex + 1}</span>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentQuestion.question}
              </ReactMarkdown>
            </p>
          </div>

          {/* Options - Compact on mobile */}
          <div className="space-y-2 md:space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              const letter = String.fromCharCode(65 + index);
              
              let optionBg = "bg-card hover:bg-muted/50";
              let badgeBg = "bg-muted text-muted-foreground";
              let borderStyle = "border-transparent";
              
              if (showResult && isCorrectOption) {
                optionBg = "bg-green-950/30";
                badgeBg = "bg-green-700 text-white";
                borderStyle = "border-green-500";
              } else if (showResult && isSelected && !isCorrectOption) {
                optionBg = "bg-red-950/20";
                badgeBg = "bg-red-700 text-white";
                borderStyle = "border-red-500";
              } else if (isSelected && !showResult) {
                optionBg = "bg-primary/10";
                badgeBg = "bg-primary text-primary-foreground";
                borderStyle = "border-primary";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-2.5 md:p-4 rounded-xl border-2 text-left transition-all duration-150",
                    "flex items-start gap-2.5 md:gap-4",
                    optionBg,
                    borderStyle,
                    !showResult && "cursor-pointer hover:shadow-md active:scale-[0.99]"
                  )}
                >
                  <span className={cn(
                    "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-bold text-xs md:text-sm shrink-0 transition-colors duration-150",
                    badgeBg
                  )}>
                    {letter}
                  </span>
                  <span className="flex-1 text-sm md:text-base pt-0.5 md:pt-1">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {option}
                    </ReactMarkdown>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Correct Answer & Explanation - Compact on mobile */}
          {showResult && (
            <div className={cn(
              "rounded-xl p-3 md:p-4 border-2 animate-fade-in",
              skippedQuestions.has(currentIndex)
                ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"
                : "bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200/50 dark:border-yellow-800/50"
            )}>
              <div className="flex items-start gap-2 md:gap-3">
                <div className={cn(
                  "p-1.5 md:p-2 rounded-full shrink-0",
                  skippedQuestions.has(currentIndex) ? "bg-amber-500/20" : "bg-yellow-500/20"
                )}>
                  <Lightbulb className={cn(
                    "w-4 h-4 md:w-5 md:h-5",
                    skippedQuestions.has(currentIndex)
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  {skippedQuestions.has(currentIndex) && (
                    <p className="text-xs md:text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                      Question skipped
                    </p>
                  )}
                  <p className="text-xs md:text-sm font-semibold text-foreground mb-1">
                    ✓ Correct: {String.fromCharCode(65 + currentQuestion.correctIndex)}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-4 md:line-clamp-none">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed at bottom, always visible */}
      <div className="shrink-0 fixed bottom-0 left-0 right-0 p-2 md:p-4 border-t bg-card/95 backdrop-blur-sm safe-area-pb z-[61]">
        <div className="max-w-2xl mx-auto flex gap-2 md:gap-3 justify-between items-center">
          {/* Skip Button */}
          {!showResult && (
            <Button
              onClick={handleSkip}
              variant="outline"
              size="default"
              className="gap-1.5 h-11 md:h-12 flex-1 md:flex-none text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="w-4 h-4" />
              <span className="text-sm md:text-base">Skip</span>
            </Button>
          )}
          
          {/* Spacer when result is shown */}
          {showResult && <div className="flex-1 md:hidden" />}
          
          {/* Submit / Next Button */}
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              size="default"
              className="gap-1.5 flex-1 md:flex-none h-11 md:h-12 text-sm md:text-base"
            >
              Submit
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              size="default"
              className="gap-1.5 flex-1 h-11 md:h-12 bg-gradient-to-r from-primary to-primary/80 text-sm md:text-base"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Results
                  <Trophy className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
