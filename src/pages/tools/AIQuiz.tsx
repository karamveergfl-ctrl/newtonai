import { useState, useRef, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { motion } from "framer-motion";
import { ToolAuthGate } from "@/components/ToolAuthGate";
import { ContentDisclaimer } from "@/components/ContentDisclaimer";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  SkipForward, 
  X, 
  Trophy,
  Lightbulb,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureLimitGate, getFeatureDisplayName } from "@/hooks/useFeatureLimitGate";
import { useGuestTrial } from "@/contexts/GuestTrialContext";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";
import { NewtonFeedback } from "@/components/NewtonFeedback";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";
import { logGeneration } from "@/hooks/useGenerationHistory";
import { ToolPagePromoSections } from "@/components/tool-sections";
import { InlineRecents } from "@/components/InlineRecents";
import { PrimaryAdBanner } from "@/components/PrimaryAdBanner";

// Question type components
import { TrueFalseQuestion } from "@/components/quiz/TrueFalseQuestion";
import { FillBlankQuestion } from "@/components/quiz/FillBlankQuestion";
import { ShortAnswerQuestion } from "@/components/quiz/ShortAnswerQuestion";
import { MatchQuestion } from "@/components/quiz/MatchQuestion";

interface QuizQuestion {
  id: string;
  type: "mcq" | "true_false" | "fill_blank" | "short_answer" | "match";
  question?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: boolean | string;
  sentence?: string;
  rubric?: string;
  instruction?: string;
  pairs?: { left: string; right: string }[];
  explanation: string;
  difficulty?: string;
}

interface QuizAnswer {
  questionId: string;
  isCorrect: boolean;
  skipped: boolean;
}

interface PendingContent {
  content: string;
  type: string;
  metadata?: { videoId?: string; file?: File; language?: string };
}

const AIQuiz = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [retryMode, setRetryMode] = useState(false);
  const { toast } = useToast();
  
  const { tryUseFeature, confirmUsage, feature, showLimitModal, setShowLimitModal, subscription } = useFeatureLimitGate("quiz");
  const { showProcessing, hideProcessing } = useProcessingOverlay();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [errorState, setErrorState] = useState<"confused" | null>(null);
  const { isIdle, resetIdle } = useIdleTimeout({ timeout: 300000, enabled: questions.length > 0 && !quizCompleted });
  const { incrementGuestUsage, isAuthenticated, setShowTrialPrompt, guestLimitReached } = useGuestTrial();

  // Per-question state for interactive types
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");
  const [shortAnswer, setShortAnswer] = useState("");
  const [shortAnswerScore, setShortAnswerScore] = useState<number | null>(null);
  const [shortAnswerFeedback, setShortAnswerFeedback] = useState<string | null>(null);
  const [isGradingShortAnswer, setIsGradingShortAnswer] = useState(false);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
  const [matchAnswers, setMatchAnswers] = useState<Record<number, number>>({});

  // Adaptive difficulty tracking
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<string>("medium");

  const resetQuestionState = () => {
    setFillBlankAnswer("");
    setShortAnswer("");
    setShortAnswerScore(null);
    setShortAnswerFeedback(null);
    setTrueFalseAnswer(null);
    setMcqAnswer(null);
    setMatchAnswers({});
    setShowResult(false);
  };

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    if (!isAuthenticated && guestLimitReached) {
      setShowTrialPrompt(true);
      return;
    }
    const allowed = await tryUseFeature();
    if (!allowed) return;
    setPendingContent({ content, type, metadata });
    setShowSettingsDialog(true);
  };

  const handleConfirmGenerate = async (settings: UniversalGenerationSettings) => {
    if (!pendingContent) return;
    const { content, type, metadata } = pendingContent;
    setPendingContent(null);
    
    abortControllerRef.current = new AbortController();
    setIsGenerating(true);
    showProcessing({
      message: "Creating quiz questions...",
      subMessage: "Analyzing your content",
      variant: "overlay",
      canCancel: true,
      onCancel: handleCancelGeneration,
    });
    
    setQuestions([]);
    setScore(0);
    setCurrentIndex(0);
    setQuizCompleted(false);
    setAnswers([]);
    setRetryMode(false);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      let textContent = content;
      if (type === "youtube" && metadata?.videoId) {
        textContent = await getYouTubeTranscript(metadata.videoId, session.access_token);
      } else if (type === "recording") {
        textContent = await transcribeAudio(content, session.access_token, undefined, metadata?.language);
      } else if (type === "upload" && metadata?.file) {
        textContent = await processUploadedFile(metadata.file, session.access_token);
      }

      if (!textContent?.trim()) throw new Error("No content to process");

      const response = await fetchWithTimeout(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            type: "text",
            content: textContent.slice(0, 8000),
            language: metadata?.language || "en",
            settings: {
              count: settings.count,
              difficulty: settings.difficulty,
              questionTypes: settings.questionTypes || ["mcq"],
              includeExplanations: settings.includeExplanations,
            },
          }),
          signal: abortControllerRef.current?.signal,
          timeoutMs: 45000,
        }
      );

      if (!response.ok) throw new Error("Failed to generate quiz");
      const data = await response.json();
      
      await confirmUsage();
      await logGeneration({
        tool_name: 'quiz',
        title: `${data.questions.length} Quiz Questions`,
        source_type: type,
        source_preview: textContent.slice(0, 200),
        result_preview: { questionCount: data.questions.length, difficulty: settings.difficulty, types: settings.questionTypes },
      });

      if (!isAuthenticated) incrementGuestUsage();

      hideProcessing();
      setIsGenerating(false);
      
      // For adaptive mode, sort questions by difficulty pools
      let processedQuestions = data.questions;
      if (settings.difficulty === "adaptive") {
        setAdaptiveDifficulty("medium");
      }
      
      setQuestions(processedQuestions);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        hideProcessing();
        setIsGenerating(false);
        toast({ title: "Cancelled", description: "Quiz generation was cancelled" });
        return;
      }
      hideProcessing();
      setIsGenerating(false);
      setErrorState("confused");
      setTimeout(() => {
        setErrorState(null);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to generate quiz. Please try again.",
          variant: "destructive",
        });
      }, 2000);
    }
  };
  
  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    hideProcessing();
    setIsGenerating(false);
    toast({ title: "Cancelled", description: "Quiz generation stopped" });
  };

  const markAnswer = (isCorrect: boolean) => {
    const currentQ = questions[currentIndex];
    setAnswers(prev => [...prev, { questionId: currentQ.id, isCorrect, skipped: false }]);
    if (isCorrect) {
      setScore(prev => prev + 1);
      setConsecutiveCorrect(prev => prev + 1);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong(prev => prev + 1);
      setConsecutiveCorrect(0);
    }
    setShowResult(true);
  };

  const handleMCQSelect = (index: number) => {
    if (showResult) return;
    setMcqAnswer(index);
    const isCorrect = index === questions[currentIndex].correctIndex;
    markAnswer(isCorrect);
  };

  const handleTrueFalseSelect = (value: boolean) => {
    if (showResult) return;
    setTrueFalseAnswer(value);
    const isCorrect = value === questions[currentIndex].correctAnswer;
    markAnswer(isCorrect);
  };

  const handleFillBlankSubmit = () => {
    const correct = questions[currentIndex].correctAnswer as string;
    const isCorrect = fillBlankAnswer.trim().toLowerCase() === correct.trim().toLowerCase();
    markAnswer(isCorrect);
  };

  const handleShortAnswerSubmit = async () => {
    setIsGradingShortAnswer(true);
    const currentQ = questions[currentIndex];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetchWithTimeout(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `Grade this answer. Question: "${currentQ.question}" Expected answer: "${currentQ.correctAnswer}" Student answer: "${shortAnswer}" Rubric: "${currentQ.rubric || ''}"
Return ONLY JSON: {"score": 0.0-1.0, "feedback": "one sentence feedback"}`
            }],
          }),
          timeoutMs: 15000,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || data.content || "";
        try {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            setShortAnswerScore(parsed.score ?? 0);
            setShortAnswerFeedback(parsed.feedback ?? "");
            markAnswer((parsed.score ?? 0) >= 0.7);
          } else throw new Error("No JSON");
        } catch {
          setShortAnswerScore(0.5);
          setShortAnswerFeedback("Could not evaluate automatically.");
          markAnswer(false);
        }
      } else {
        setShortAnswerScore(0);
        setShortAnswerFeedback("Grading failed. Answer marked for review.");
        markAnswer(false);
      }
    } catch {
      setShortAnswerScore(0);
      setShortAnswerFeedback("Grading timed out.");
      markAnswer(false);
    } finally {
      setIsGradingShortAnswer(false);
    }
  };

  const handleMatchSubmit = () => {
    const currentQ = questions[currentIndex];
    const totalPairs = currentQ.pairs?.length || 0;
    const correctCount = Object.entries(matchAnswers).filter(([k, v]) => parseInt(k) === v).length;
    markAnswer(correctCount >= totalPairs * 0.6);
  };

  const handleSkip = () => {
    const currentQ = questions[currentIndex];
    setAnswers(prev => [...prev, { questionId: currentQ.id, isCorrect: false, skipped: true }]);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    resetQuestionState();
    setScore(0);
    setQuizCompleted(false);
    setAnswers([]);
    setRetryMode(false);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
  };

  const handleRetryWrong = () => {
    const wrongQuestions = questions.filter((q) => {
      const answer = answers.find(a => a.questionId === q.id);
      return answer && !answer.isCorrect;
    });
    if (wrongQuestions.length === 0) return;
    setQuestions(wrongQuestions);
    setCurrentIndex(0);
    resetQuestionState();
    setScore(0);
    setQuizCompleted(false);
    setAnswers([]);
    setRetryMode(true);
  };

  const currentQuestion = questions[currentIndex];
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const quizProgress = questions.length > 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100 : 0;

  // Weak area summary
  const getWeakAreas = () => {
    const topicErrors: Record<string, { wrong: number; total: number }> = {};
    questions.forEach((q) => {
      const topic = q.difficulty || "general";
      if (!topicErrors[topic]) topicErrors[topic] = { wrong: 0, total: 0 };
      topicErrors[topic].total++;
      const ans = answers.find(a => a.questionId === q.id);
      if (ans && !ans.isCorrect) topicErrors[topic].wrong++;
    });
    return Object.entries(topicErrors)
      .filter(([_, v]) => v.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong);
  };

  const wrongCount = answers.filter(a => !a.isCorrect && !a.skipped).length;
  const skippedCount = answers.filter(a => a.skipped).length;

  const getContentTitle = () => {
    if (!pendingContent) return "";
    if (pendingContent.type === "youtube") return "YouTube Video";
    if (pendingContent.type === "recording") return "Audio Recording";
    if (pendingContent.metadata?.file) return pendingContent.metadata.file.name;
    return "Text Content";
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "AI Quiz", href: "/tools/quiz" },
  ];

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case "true_false":
        return (
          <TrueFalseQuestion
            question={currentQuestion.question || ""}
            correctAnswer={currentQuestion.correctAnswer as boolean}
            selectedAnswer={trueFalseAnswer}
            showResult={showResult}
            onSelect={handleTrueFalseSelect}
          />
        );

      case "fill_blank":
        return (
          <FillBlankQuestion
            sentence={currentQuestion.sentence || ""}
            correctAnswer={currentQuestion.correctAnswer as string}
            userAnswer={fillBlankAnswer}
            showResult={showResult}
            onAnswerChange={setFillBlankAnswer}
            onSubmit={handleFillBlankSubmit}
          />
        );

      case "short_answer":
        return (
          <ShortAnswerQuestion
            question={currentQuestion.question || ""}
            correctAnswer={currentQuestion.correctAnswer as string}
            userAnswer={shortAnswer}
            showResult={showResult}
            aiScore={shortAnswerScore}
            aiFeedback={shortAnswerFeedback}
            isGrading={isGradingShortAnswer}
            onAnswerChange={setShortAnswer}
            onSubmit={handleShortAnswerSubmit}
          />
        );

      case "match":
        return (
          <MatchQuestion
            pairs={currentQuestion.pairs || []}
            showResult={showResult}
            userMatches={matchAnswers}
            onMatch={setMatchAnswers}
            onSubmit={handleMatchSubmit}
          />
        );

      case "mcq":
      default:
        return renderMCQ();
    }
  };

  const renderMCQ = () => {
    if (!currentQuestion?.options) return null;
    return (
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = mcqAnswer === index;
          const isCorrectOption = index === currentQuestion.correctIndex;

          let optionStyles = "bg-card hover:bg-muted/50 border-border";
          let badgeStyles = "bg-muted text-muted-foreground";
          
          if (showResult) {
            if (isCorrectOption) {
              optionStyles = "bg-accent/10 border-accent dark:bg-accent/20";
              badgeStyles = "bg-accent text-accent-foreground";
            } else if (isSelected && !isCorrectOption) {
              optionStyles = "bg-destructive/10 border-destructive dark:bg-destructive/20";
              badgeStyles = "bg-destructive text-destructive-foreground";
            }
          } else if (isSelected) {
            optionStyles = "bg-primary/5 border-primary";
            badgeStyles = "bg-primary text-primary-foreground";
          }

          return (
            <motion.button
              key={index}
              whileHover={{ scale: showResult ? 1 : 1.01 }}
              whileTap={{ scale: showResult ? 1 : 0.99 }}
              onClick={() => handleMCQSelect(index)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                "flex items-start gap-3 sm:gap-4 min-h-[56px]",
                optionStyles,
                !showResult && "cursor-pointer hover:shadow-md active:shadow-sm"
              )}
            >
              <span className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                badgeStyles
              )}>
                {showResult && isCorrectOption ? <CheckCircle className="w-5 h-5" /> : showResult && isSelected && !isCorrectOption ? <XCircle className="w-5 h-5" /> : letter}
              </span>
              <span className="flex-1 pt-1.5 text-sm sm:text-base">
                <MarkdownRenderer content={option} className="prose-sm" />
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  };

  const getQuestionLabel = () => {
    if (!currentQuestion) return "";
    const labels: Record<string, string> = {
      mcq: "Multiple Choice",
      true_false: "True or False",
      fill_blank: "Fill in the Blank",
      short_answer: "Short Answer",
      match: "Match the Following",
    };
    return labels[currentQuestion.type] || "Question";
  };

  return (
    <AppLayout>
      <SEOHead
        title="AI Quiz Generator"
        description="Test your knowledge with AI-generated quizzes from any content. Get instant feedback and explanations for each question."
        canonicalPath="/tools/quiz"
        breadcrumbs={breadcrumbs}
        keywords="AI quiz, quiz generator, test yourself, study quiz, practice questions"
      />
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div className="relative text-center mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="absolute right-0 top-0 h-10 w-10 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="inline-flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-primary/10 mb-3">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-tight">AI Quiz</h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-sans px-4 sm:px-0">
              Test your knowledge with AI-generated quizzes
            </p>
          </div>

          {questions.length === 0 ? (
            !isGenerating && (
              <div className="space-y-6">
                <ToolAuthGate>
                  <Card className="border-border/50 shadow-lg">
                    <CardContent className="pt-6">
                      <ContentInputTabs
                        onContentReady={handleContentReady}
                        isProcessing={isGenerating}
                        placeholder="Paste your study content here..."
                        supportedFormats="PDF, TXT, Images; Max size: 20MB"
                      />
                      <InlineRecents toolId="quiz" />
                    </CardContent>
                  </Card>
                </ToolAuthGate>
                <PrimaryAdBanner />
                <ContentDisclaimer />
                <ToolPagePromoSections toolId="quiz" />
              </div>
            )
          ) : quizCompleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <ConfettiCelebration isActive={quizCompleted} />
              <Card className="text-center border-border/50 shadow-lg overflow-hidden">
                <CardContent className="py-8 sm:py-12 space-y-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative inline-block"
                  >
                    <div className={cn(
                      "w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mx-auto",
                      percentage >= 80 ? "bg-primary/15" : percentage >= 60 ? "bg-muted" : "bg-destructive/15"
                    )}>
                      <Trophy className={cn(
                        "w-12 h-12 sm:w-14 sm:h-14",
                        percentage >= 80 ? "text-primary" : percentage >= 60 ? "text-muted-foreground" : "text-destructive"
                      )} />
                    </div>
                  </motion.div>

                  <div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-5xl sm:text-6xl font-display font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent"
                    >
                      {percentage}%
                    </motion.div>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-base sm:text-lg text-muted-foreground font-sans mt-2"
                    >
                      You got <span className="font-semibold text-foreground">{score}</span> out of <span className="font-semibold text-foreground">{questions.length}</span> correct
                    </motion.p>
                    {skippedCount > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">({skippedCount} skipped)</p>
                    )}
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg sm:text-xl font-medium"
                  >
                    {percentage >= 80 ? "Excellent! 🎉" : percentage >= 60 ? "Good Job! 👍" : "Keep Learning! 📚"}
                  </motion.p>

                  {/* Weak Areas Summary */}
                  {getWeakAreas().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                      className="bg-muted/50 rounded-lg p-4 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm font-semibold">Areas to improve:</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {getWeakAreas().slice(0, 3).map(([topic, { wrong, total }]) => (
                          <li key={topic}>• {topic}: {wrong}/{total} incorrect</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto pt-2"
                  >
                    <Button onClick={resetQuiz} variant="outline" className="flex-1 h-12 gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                    {wrongCount > 0 && (
                      <Button onClick={handleRetryWrong} variant="secondary" className="flex-1 h-12 gap-2">
                        <XCircle className="h-4 w-4" />
                        Retry Wrong ({wrongCount})
                      </Button>
                    )}
                    <Button onClick={() => navigate("/dashboard")} className="flex-1 h-12 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Done
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="bg-card rounded-lg p-3 sm:p-4 border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-primary">
                    Score: {score}/{currentIndex + (showResult ? 1 : 0)}
                  </span>
                </div>
                <Progress value={quizProgress} className="h-2" />
              </div>

              {/* Question Card */}
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <div className="bg-primary/5 border-b border-border/50 px-4 py-3 flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {currentIndex + 1}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{getQuestionLabel()}</span>
                  {currentQuestion?.difficulty && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full ml-auto",
                      currentQuestion.difficulty === "easy" && "bg-green-500/20 text-green-600 dark:text-green-400",
                      currentQuestion.difficulty === "medium" && "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
                      currentQuestion.difficulty === "hard" && "bg-red-500/20 text-red-600 dark:text-red-400"
                    )}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </div>
                <CardContent className="p-4 sm:p-6">
                  {currentQuestion?.type !== "match" && currentQuestion?.type !== "fill_blank" && (
                    <div className="text-base sm:text-lg font-semibold leading-relaxed mb-4">
                      <MarkdownRenderer content={currentQuestion?.question || currentQuestion?.instruction || ""} />
                    </div>
                  )}
                  {currentQuestion?.type === "fill_blank" && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Fill in the blank:</p>
                    </div>
                  )}
                  {currentQuestion?.type === "match" && currentQuestion?.instruction && (
                    <div className="text-base sm:text-lg font-semibold leading-relaxed mb-4">
                      <MarkdownRenderer content={currentQuestion.instruction} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Answer Area */}
              {renderQuestion()}

              {/* Skip Button */}
              {!showResult && currentQuestion?.type === "mcq" && (
                <Button onClick={handleSkip} variant="outline" className="w-full h-12 gap-2 text-muted-foreground">
                  <SkipForward className="h-4 w-4" />
                  Skip Question
                </Button>
              )}

              {/* Explanation */}
              {showResult && currentQuestion?.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className="border-2 overflow-hidden bg-accent/5 border-accent/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full shrink-0 bg-accent/15">
                          <Lightbulb className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground mb-1">Explanation</p>
                          <div className="text-sm text-muted-foreground">
                            <MarkdownRenderer content={currentQuestion.explanation} className="prose-sm" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Button onClick={handleNext} className="w-full h-12 gap-2 text-base">
                    {currentIndex < questions.length - 1 ? (
                      <>Next Question <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>See Results <Trophy className="w-4 h-4" /></>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Next button when no explanation */}
              {showResult && !currentQuestion?.explanation && (
                <Button onClick={handleNext} className="w-full h-12 gap-2 text-base">
                  {currentIndex < questions.length - 1 ? (
                    <>Next Question <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>See Results <Trophy className="w-4 h-4" /></>
                  )}
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <UniversalStudySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        type="quiz"
        contentTitle={getContentTitle()}
        contentType={pendingContent?.type as any}
        onGenerate={handleConfirmGenerate}
      />

      <NewtonFeedback state={errorState} onDismiss={() => setErrorState(null)} />

      {isIdle && questions.length > 0 && !quizCompleted && (
        <NewtonFeedback state="sleeping" onDismiss={resetIdle} />
      )}

      <UsageLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName={getFeatureDisplayName("quiz")}
        currentUsage={feature?.used || 0}
        limit={feature?.limit || 0}
        unit={feature?.unit}
        tier={subscription.tier}
        proLimit={90}
      />
    </AppLayout>
  );
};

export default AIQuiz;
