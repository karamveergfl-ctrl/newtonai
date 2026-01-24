import { useState, useRef } from "react";
import { motion } from "framer-motion";
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
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureLimitGate, getFeatureDisplayName } from "@/hooks/useFeatureLimitGate";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { useProcessingState } from "@/hooks/useProcessingState";
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

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  
  // Use feature limit gate instead of credit gate
  const { tryUseFeature, confirmUsage, feature, showLimitModal, setShowLimitModal, subscription } = useFeatureLimitGate("quiz");

  // Processing animation state
  const { isProcessing: isGenerating, start: startProcessing, stop: stopProcessing, reset: resetProcessing } = useProcessingState();

  // Settings dialog state
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);
  
  // AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Error state for confused Newton
  const [errorState, setErrorState] = useState<"confused" | null>(null);

  // Idle timeout for sleeping Newton (5 minutes)
  const { isIdle, resetIdle } = useIdleTimeout({ 
    timeout: 300000,
    enabled: questions.length > 0 && !quizCompleted
  });

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    const allowed = await tryUseFeature();
    if (!allowed) return;

    // Store pending content and show settings dialog
    setPendingContent({ content, type, metadata });
    setShowSettingsDialog(true);
  };

  const handleConfirmGenerate = async (settings: UniversalGenerationSettings) => {
    if (!pendingContent) return;

    const { content, type, metadata } = pendingContent;
    setPendingContent(null);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    startProcessing();
    setQuestions([]);
    setScore(0);
    setCurrentIndex(0);
    setQuizCompleted(false);

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

      if (!textContent?.trim()) {
        throw new Error("No content to process");
      }

      const response = await fetch(
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
            },
          }),
          signal: abortControllerRef.current?.signal,
        }
      );

      if (!response.ok) throw new Error("Failed to generate quiz");

      const data = await response.json();
      
      // Track usage after successful generation
      await confirmUsage();
      
      // Log generation to history
      await logGeneration({
        tool_name: 'quiz',
        title: `${data.questions.length} Quiz Questions`,
        source_type: type,
        source_preview: textContent.slice(0, 200),
        result_preview: { questionCount: data.questions.length, difficulty: settings.difficulty },
      });

      // Stop processing and show results immediately
      stopProcessing();
      setQuestions(data.questions);
      toast({
        title: "Quiz Ready! 🧠",
        description: `Generated ${data.questions.length} questions`,
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        resetProcessing();
        toast({
          title: "Cancelled",
          description: "Quiz generation was cancelled",
        });
        return;
      }
      
      resetProcessing();
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
    resetProcessing();
    toast({
      title: "Cancelled",
      description: "Quiz generation stopped",
    });
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setSkippedQuestions(prev => new Set(prev).add(currentIndex));
    setShowResult(true);
    setSelectedAnswer(null); // No answer selected
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
    setSkippedQuestions(new Set());
  };

  const currentQuestion = questions[currentIndex];

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

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const quizProgress = questions.length > 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100 : 0;

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
            isGenerating ? (
              <ProcessingOverlay
                isVisible={isGenerating}
                message="Creating quiz questions..."
                subMessage="Analyzing your content"
                variant="card"
                canCancel={true}
                onCancel={handleCancelGeneration}
              />
            ) : (
              <div className="space-y-6">
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="pt-6">
                    <ContentInputTabs
                      onContentReady={handleContentReady}
                      isProcessing={isGenerating}
                      placeholder="Paste your study content here..."
                      supportedFormats="PDF, TXT, Images; Max size: 20MB"
                    />
                  </CardContent>
                </Card>

                {/* Promotional sections with FAQ included */}
                <ToolPagePromoSections toolId="quiz" />
              </div>
            )
          ) : quizCompleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              {/* Confetti celebration */}
              <ConfettiCelebration isActive={quizCompleted} />
              
              <Card className="text-center border-border/50 shadow-lg overflow-hidden">
                <CardContent className="py-8 sm:py-12 space-y-6">
                  {/* Trophy with animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative inline-block"
                  >
                    <div className={cn(
                      "w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mx-auto",
                      percentage >= 80 
                        ? "bg-gradient-to-br from-yellow-400/20 to-amber-500/20" 
                        : percentage >= 60 
                        ? "bg-gradient-to-br from-gray-300/20 to-gray-400/20"
                        : "bg-gradient-to-br from-orange-400/20 to-red-500/20"
                    )}>
                      <Trophy className={cn(
                        "w-12 h-12 sm:w-14 sm:h-14",
                        percentage >= 80 
                          ? "text-yellow-500" 
                          : percentage >= 60 
                          ? "text-gray-400"
                          : "text-orange-500"
                      )} />
                    </div>
                  </motion.div>

                  {/* Score display */}
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
                    {skippedQuestions.size > 0 && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-sm text-muted-foreground mt-1"
                      >
                        ({skippedQuestions.size} skipped)
                      </motion.p>
                    )}
                  </div>

                  {/* Message based on score */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg sm:text-xl font-medium"
                  >
                    {percentage >= 80 ? "Excellent! 🎉" : percentage >= 60 ? "Good Job! 👍" : "Keep Learning! 📚"}
                  </motion.p>

                  {/* Action buttons */}
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
              {/* Progress bar at top */}
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
                {/* Question header badge */}
                <div className="bg-primary/5 border-b border-border/50 px-4 py-3 flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {currentIndex + 1}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">Question</span>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-base sm:text-lg font-semibold leading-relaxed">
                    <MarkdownRenderer content={currentQuestion?.question || ""} />
                  </div>
                </CardContent>
              </Card>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion?.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption = index === currentQuestion.correctIndex;
                  const wasSkipped = skippedQuestions.has(currentIndex);
                  
                  let optionStyles = "bg-card hover:bg-muted/50 border-border";
                  let badgeStyles = "bg-muted text-muted-foreground";
                  
                  if (showResult) {
                    if (isCorrectOption) {
                      optionStyles = "bg-green-50 dark:bg-green-900/20 border-green-500";
                      badgeStyles = "bg-green-500 text-white";
                    } else if (isSelected && !isCorrectOption) {
                      optionStyles = "bg-red-50 dark:bg-red-900/20 border-red-400";
                      badgeStyles = "bg-red-400 text-white";
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
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all",
                        "flex items-start gap-3 sm:gap-4 min-h-[56px]",
                        optionStyles,
                        !showResult && "cursor-pointer hover:shadow-md active:shadow-sm"
                      )}
                    >
                      {/* Letter badge */}
                      <span className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                        badgeStyles
                      )}>
                        {showResult && isCorrectOption ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : showResult && isSelected && !isCorrectOption ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          letter
                        )}
                      </span>
                      <span className="flex-1 pt-1.5 text-sm sm:text-base">
                        <MarkdownRenderer content={option} className="prose-sm" />
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Skip Button - only show when answer not yet submitted */}
              {!showResult && (
                <Button 
                  onClick={handleSkip} 
                  variant="outline" 
                  className="w-full h-12 gap-2 text-muted-foreground"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip Question
                </Button>
              )}

              {/* Explanation Card */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className={cn(
                    "border-2 overflow-hidden",
                    skippedQuestions.has(currentIndex) 
                      ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"
                      : "bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200/50 dark:border-yellow-800/50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-full shrink-0",
                          skippedQuestions.has(currentIndex)
                            ? "bg-amber-500/20"
                            : "bg-yellow-500/20"
                        )}>
                          <Lightbulb className={cn(
                            "w-5 h-5",
                            skippedQuestions.has(currentIndex)
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-yellow-600 dark:text-yellow-400"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {skippedQuestions.has(currentIndex) && (
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                              Question skipped
                            </p>
                          )}
                          <p className="text-sm font-semibold text-foreground mb-1">Explanation</p>
                          <div className="text-sm text-muted-foreground">
                            <MarkdownRenderer content={currentQuestion?.explanation || ""} className="prose-sm" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Button onClick={handleNext} className="w-full h-12 gap-2 text-base">
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        See Results
                        <Trophy className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Settings Dialog */}
      <UniversalStudySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        type="quiz"
        contentTitle={getContentTitle()}
        contentType={pendingContent?.type as any}
        onGenerate={handleConfirmGenerate}
      />

      {/* Confused Newton for errors */}
      <NewtonFeedback 
        state={errorState} 
        onDismiss={() => setErrorState(null)}
      />

      {/* Sleeping Newton for idle state */}
      {isIdle && questions.length > 0 && !quizCompleted && (
        <NewtonFeedback 
          state="sleeping"
          onDismiss={resetIdle}
        />
      )}

      {/* Usage Limit Modal */}
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
