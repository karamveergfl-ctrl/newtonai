import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layers, RotateCcw, ChevronLeft, ChevronRight, X, Check, Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { Flashcard } from "@/components/Flashcard";
import { FlashcardCompletionScreen } from "@/components/FlashcardCompletionScreen";
import { useFeatureLimitGate, getFeatureDisplayName } from "@/hooks/useFeatureLimitGate";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";
import { NewtonFeedback } from "@/components/NewtonFeedback";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { cn } from "@/lib/utils";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";
import { logGeneration } from "@/hooks/useGenerationHistory";
import { ToolPagePromoSections } from "@/components/tool-sections";
import { InlineRecents } from "@/components/InlineRecents";
import { PrimaryAdBanner } from "@/components/PrimaryAdBanner";


interface FlashcardData {
  id: string;
  front: string;
  back: string;
}

interface PendingContent {
  content: string;
  type: string;
  metadata?: { videoId?: string; file?: File; language?: string };
}

const AIFlashcards = () => {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [showCompletion, setShowCompletion] = useState(false);
  const { toast } = useToast();
  
  // Use feature limit gate instead of credit gate
  const { tryUseFeature, confirmUsage, feature, showLimitModal, setShowLimitModal, subscription } = useFeatureLimitGate("flashcards");

  // Global processing overlay
  const { showProcessing, hideProcessing } = useProcessingOverlay();
  const [isGenerating, setIsGenerating] = useState(false);

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
    enabled: flashcards.length > 0 
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
    
    // Show global processing overlay IMMEDIATELY
    setIsGenerating(true);
    showProcessing({
      message: "Creating flashcards...",
      subMessage: "Analyzing your content",
      variant: "overlay",
      canCancel: true,
      onCancel: handleCancelGeneration,
    });
    
    setFlashcards([]);

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            type: type === "youtube" ? "video" : "text",
            videoTitle: type === "youtube" ? (textContent.split('\n')[0]?.replace('Video Title: ', '') || 'YouTube Video') : undefined,
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

      if (!response.ok) throw new Error("Failed to generate flashcards");

      const data = await response.json();
      
      // Track usage after successful generation
      await confirmUsage();
      
      // Log generation to history
      await logGeneration({
        tool_name: 'flashcards',
        title: `${data.flashcards.length} Flashcards`,
        source_type: type,
        source_preview: textContent.slice(0, 200),
        result_preview: { cardCount: data.flashcards.length },
      });
      
      // Hide processing and show results immediately
      hideProcessing();
      setIsGenerating(false);
      setFlashcards(data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        hideProcessing();
        setIsGenerating(false);
        toast({
          title: "Cancelled",
          description: "Flashcard generation was cancelled",
        });
        return;
      }
      
      hideProcessing();
      setIsGenerating(false);
      setErrorState("confused");
      
      // Show Newton confused for 2 seconds, then show toast
      setTimeout(() => {
        setErrorState(null);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to generate flashcards. Please try again.",
          variant: "destructive",
        });
      }, 2000);
    }
  };

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    hideProcessing();
    setIsGenerating(false);
    toast({
      title: "Cancelled",
      description: "Flashcard generation stopped",
    });
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
    setIsFlipped(false);
  };

  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Reached end of deck
      setShowCompletion(true);
    }
  };

  const handleMarkMastered = () => {
    setMasteredCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
    toast({ title: "Shuffled!", description: "Cards have been shuffled" });
  };

  const handleRetryFlashcards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
    setShowCompletion(false);
  };

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

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
    { name: "AI Flashcards", href: "/tools/flashcards" },
  ];

  return (
    <AppLayout>
      <SEOHead
        title="AI Flashcards"
        description="Generate AI-powered flashcards from any content for effective studying. Upload PDFs, paste text, or use YouTube videos to create study cards."
        canonicalPath="/tools/flashcards"
        breadcrumbs={breadcrumbs}
        keywords="AI flashcards, study cards, spaced repetition, flashcard generator, study tools"
      />
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="relative text-center mb-4 sm:mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">AI Flashcards</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Generate flashcards from any content for effective studying
            </p>
          </div>

          {flashcards.length === 0 ? (
            !isGenerating && (
              <div className="space-y-6">
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="pt-6">
                    <ContentInputTabs
                      onContentReady={handleContentReady}
                      isProcessing={isGenerating}
                      placeholder="Paste your study content here (lecture notes, textbook excerpts, etc.)..."
                      supportedFormats="PDF, TXT, Images; Max size: 20MB"
                    />
                    
                    
                    {/* Inline recents - just below input */}
                    <InlineRecents toolId="flashcards" />
                  </CardContent>
                </Card>

                {/* Ad Banner - Primary placement, always shows */}
                <PrimaryAdBanner />

                {/* Promotional sections with FAQ included */}
                <ToolPagePromoSections toolId="flashcards" />
              </div>
            )
          ) : showCompletion ? (
            <FlashcardCompletionScreen
              totalCards={flashcards.length}
              masteredCount={masteredCards.size}
              onRetry={handleRetryFlashcards}
              onDone={() => {
                setFlashcards([]);
                setShowCompletion(false);
                setMasteredCards(new Set());
              }}
            />
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Progress bar */}
              <div className="px-2 sm:px-0">
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                  <span>{currentIndex + 1} of {flashcards.length}</span>
                  <span>{masteredCards.size} mastered</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between px-2 sm:px-0">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleShuffle}
                    className="h-10 gap-2"
                  >
                    <Shuffle className="h-4 w-4" />
                    <span className="hidden sm:inline">Shuffle</span>
                  </Button>
                  <Button
                    variant={masteredCards.has(currentIndex) ? "default" : "outline"}
                    size="sm"
                    onClick={handleMarkMastered}
                    className={cn(
                      "h-10 gap-2",
                      masteredCards.has(currentIndex) && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {masteredCards.has(currentIndex) ? "Mastered" : "Mark Mastered"}
                    </span>
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFlashcards([]);
                    setMasteredCards(new Set());
                  }}
                  className="h-10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Set</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>

              {currentCard && (
                <Flashcard
                  front={currentCard.front}
                  back={currentCard.back}
                  index={currentIndex}
                  total={flashcards.length}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  isMastered={masteredCards.has(currentIndex)}
                  onMarkMastered={handleMarkMastered}
                />
              )}

              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <Button 
                  variant="outline" 
                  onClick={goToPrevious} 
                  className="h-12 gap-2 min-w-[100px] sm:min-w-[120px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <Button 
                  onClick={goToNext} 
                  className="h-12 gap-2 min-w-[100px] sm:min-w-[120px]"
                >
                  <span>{currentIndex === flashcards.length - 1 ? "Finish" : "Next"}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Settings Dialog */}
      <UniversalStudySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        type="flashcards"
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
      {isIdle && flashcards.length > 0 && (
        <NewtonFeedback 
          state="sleeping"
          onDismiss={resetIdle}
        />
      )}

      {/* Usage Limit Modal */}
      <UsageLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName={getFeatureDisplayName("flashcards")}
        currentUsage={feature?.used || 0}
        limit={feature?.limit || 0}
        unit={feature?.unit}
        tier={subscription.tier}
        proLimit={90}
      />
    </AppLayout>
  );
};

export default AIFlashcards;
