import { useState, useRef } from "react";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

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
}

export const QuizMode = ({ questions, title, onClose, onComplete }: QuizModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isComplete, setIsComplete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

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
  };

  const finalScore = score + (showResult && isCorrect ? 1 : 0);
  const percentage = Math.round((finalScore / questions.length) * 100);

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="relative">
            <Trophy className={cn(
              "w-24 h-24 mx-auto animate-bounce",
              percentage >= 80 ? "text-yellow-500" : percentage >= 60 ? "text-gray-400" : "text-orange-600"
            )} />
            <Sparkles className="absolute top-0 right-1/4 w-8 h-8 text-primary animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-bold">
            {percentage >= 80 ? "Excellent! 🎉" : percentage >= 60 ? "Good Job! 👍" : "Keep Learning! 📚"}
          </h2>
          
          <div className="space-y-2">
            <p className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {finalScore}/{questions.length}
            </p>
            <p className="text-muted-foreground">
              {percentage}% correct
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground mb-1">XP Earned</p>
            <p className="text-2xl font-bold text-primary">
              +{Math.round((finalScore / questions.length) * 100) + 10} XP
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Button onClick={onClose} className="gap-2">
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{title}</h2>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Score</p>
              <p className="text-lg font-bold text-primary">{score}/{questions.length}</p>
            </div>
            <Button 
              onClick={downloadAsPDF} 
              variant="outline" 
              size="icon" 
              disabled={isDownloading}
              title="Download PDF"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-3">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-card rounded-xl p-6 border shadow-lg">
            <p className="text-lg md:text-xl font-medium leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentQuestion.question}
              </ReactMarkdown>
            </p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              
              let optionStyle = "bg-card hover:bg-muted/50 border-border";
              if (showResult) {
                if (isCorrectOption) {
                  optionStyle = "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300";
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300";
                }
              } else if (isSelected) {
                optionStyle = "bg-primary/20 border-primary";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    "flex items-center gap-3",
                    optionStyle,
                    !showResult && "cursor-pointer"
                  )}
                >
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    "border-2",
                    isSelected && !showResult ? "bg-primary text-primary-foreground border-primary" : "border-current"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {option}
                    </ReactMarkdown>
                  </span>
                  {showResult && isCorrectOption && (
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && (
            <div className={cn(
              "rounded-xl p-4 border-2 animate-fade-in",
              isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-orange-500/10 border-orange-500/30"
            )}>
              <p className={cn(
                "font-semibold mb-2",
                isCorrect ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
              )}>
                {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-card/50">
        <div className="max-w-2xl mx-auto flex justify-end">
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              size="lg"
              className="gap-2"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-secondary"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                "See Results"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
