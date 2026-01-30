import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { PodcastRaiseHand } from "@/components/PodcastRaiseHand";
import { PodcastHistory } from "@/components/PodcastHistory";
import { PodcastStylePresets, PodcastSettings } from "@/components/PodcastStylePresets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Podcast, Sparkles, ArrowLeft, Volume2, Minimize2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useFeatureLimitGate, getFeatureDisplayName } from "@/hooks/useFeatureLimitGate";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { CreditModal } from "@/components/CreditModal";
import { usePodcastContext } from "@/contexts/PodcastContext";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";
import { NewtonFeedback } from "@/components/NewtonFeedback";
import { usePodcastPreferences } from "@/hooks/usePodcastPreferences";
import { ToolPagePromoSections } from "@/components/tool-sections";
import { InlineRecents } from "@/components/InlineRecents";
import { StudyStreakWidget } from "@/components/StudyStreakWidget";


interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string;
  fallbackAudio?: boolean;
}

interface SavedPodcast {
  id: string;
  title: string;
  script: { segments: PodcastSegment[] };
  audio_segments: PodcastSegment[] | null;
  duration_seconds: number;
  created_at: string;
  source_content: string | null;
  language?: string; // Language code for voice selection
}

type GenerationStep = "idle" | "analyzing" | "scripting" | "voicing" | "complete";

const stepMessages: Record<GenerationStep, string> = {
  idle: "",
  analyzing: "Analyzing your content...",
  scripting: "Writing podcast script...",
  voicing: "Generating professional voices...",
  complete: "Your podcast is ready!",
};

export default function AIPodcast() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [sourceContent, setSourceContent] = useState("");
  const [isRaiseHandOpen, setIsRaiseHandOpen] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showStylePresets, setShowStylePresets] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const { hasEnoughCredits, spendCredits, getFeatureCost, isPremium, credits, earnCredits, canWatchMoreAds, getRemainingAds } = useCredits();
  const { tryUseFeature, confirmUsage, feature, showLimitModal, setShowLimitModal, subscription } = useFeatureLimitGate("ai_podcast");
  const { hasCompletedSetup } = usePodcastPreferences();
  
  // Global processing overlay
  const { showProcessing, hideProcessing, updateProgress, updateMessage } = useProcessingOverlay();
  
  // Error state for confused Newton
  const [errorState, setErrorState] = useState<"confused" | null>(null);
  
  // Store pending content for generation after style selection
  const pendingContentRef = useRef<{
    content: string;
    type: "upload" | "recording" | "youtube" | "text";
    metadata?: { videoId?: string; videoTitle?: string; file?: File; language?: string };
  } | null>(null);
  
  // Use global podcast context
  const { 
    podcast, 
    setPodcast, 
    isMinimized, 
    setIsMinimized,
    pause,
    isPlaying,
  } = usePodcastContext();

  const creditCost = getFeatureCost("ai_podcast");

  // When navigating to this page, un-minimize if podcast is playing
  useEffect(() => {
    if (podcast && isMinimized) {
      setIsMinimized(false);
    }
  }, []);

  // Auto-minimize when navigating away from podcast page
  useEffect(() => {
    return () => {
      // On unmount (navigating away), minimize if podcast is active
      if (podcast && isPlaying) {
        setIsMinimized(true);
      }
    };
  }, [podcast, isPlaying, setIsMinimized]);

  const handleContentReady = async (
    content: string,
    type: "upload" | "recording" | "youtube" | "text",
    metadata?: { videoId?: string; videoTitle?: string; file?: File; language?: string }
  ) => {
    // Check feature limits first
    const allowed = await tryUseFeature();
    if (!allowed) return;

    // Store content and show style presets dialog
    pendingContentRef.current = { content, type, metadata };
    setShowStylePresets(true);
  };

  const handleGenerateWithSettings = async (settings: PodcastSettings) => {
    const pending = pendingContentRef.current;
    if (!pending) return;

    const { content, type, metadata } = pending;
    pendingContentRef.current = null;

    // Show global processing overlay IMMEDIATELY
    setIsProcessing(true);
    showProcessing({
      message: stepMessages["analyzing"],
      subMessage: "This may take a minute...",
      variant: "overlay",
    });
    
    setProgress(0);
    setGenerationStep("analyzing");

    let processedContent = content;

    try {
      // If file is uploaded, extract text from it first
      if (type === "upload" && metadata?.file && !content) {
        const file = metadata.file;
        
        if (file.type === "application/pdf") {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(file);
          });
          
          const { data: pdfData, error: pdfError } = await supabase.functions.invoke(
            "extract-pdf-text",
            { body: { pdfContent: base64 } }
          );
          
          if (pdfError) throw new Error("Failed to extract text from PDF");
          processedContent = pdfData?.text || "";
        } else if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(file);
          });
          
          const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
            "ocr-handwriting",
            { body: { image: base64 } }
          );
          
          if (ocrError) throw new Error("Failed to extract text from image");
          processedContent = ocrData?.text || "";
        } else {
          processedContent = await file.text();
        }
      } else if (type === "youtube" && metadata?.videoId) {
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke(
          "fetch-transcript",
          { body: { videoId: metadata.videoId } }
        );
        
        if (transcriptError) throw new Error("Failed to fetch YouTube transcript");
        processedContent = transcriptData?.transcript || "";
      } else if (type === "recording" && content) {
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
          "transcribe-audio",
          { body: { audio: content, mimeType: "audio/webm" } }
        );
        
        if (transcribeError) throw new Error("Failed to transcribe audio");
        processedContent = transcribeData?.text || "";
      }

      if (!processedContent.trim()) {
        throw new Error("Could not extract any content. Please try with different input.");
      }

      setSourceContent(processedContent);

      // Step 1: Generate script with settings
      setGenerationStep("scripting");
      setProgress(20);
      updateProgress(20);
      updateMessage(stepMessages["scripting"], "Creating the podcast script...");

      const { data: scriptData, error: scriptError } = await supabase.functions.invoke(
        "generate-podcast-script",
        {
          body: { 
            content: processedContent, 
            title: metadata?.videoTitle,
            settings: settings,
          },
        }
      );

      if (scriptError) throw scriptError;
      if (!scriptData?.segments) throw new Error("Failed to generate script");

      setProgress(40);
      updateProgress(40);

      // Step 2: Generate ElevenLabs audio for each segment
      setGenerationStep("voicing");
      updateMessage(stepMessages["voicing"], "Creating professional voice audio...");
      
      let segments: PodcastSegment[] = scriptData.segments.map((segment: any) => ({
        speaker: segment.speaker,
        name: segment.name,
        text: segment.text,
        emotion: segment.emotion,
        fallbackAudio: true, // Default to Web Speech fallback
      }));

      // Try to generate ElevenLabs audio with language and custom voices support
      try {
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke(
          "elevenlabs-podcast-tts",
          {
            body: { 
              segments: scriptData.segments,
              language: settings.language || "en",
              host1VoiceId: settings.host1VoiceId,
              host2VoiceId: settings.host2VoiceId,
            },
          }
        );

        if (!ttsError && ttsData?.segments) {
          // Update segments with audio data
          segments = ttsData.segments.map((seg: any, idx: number) => ({
            ...segments[idx],
            audio: seg.audio || null,
            fallbackAudio: !seg.audio, // Only use fallback if no audio
          }));

          if (ttsData.stats?.failed > 0) {
            console.log(`${ttsData.stats.failed} segments will use browser voice fallback`);
          }
        } else {
          console.log("ElevenLabs TTS unavailable, using browser voice");
        }
      } catch (ttsErr) {
        console.log("ElevenLabs TTS failed, using browser voice fallback:", ttsErr);
      }

      setProgress(90);
      updateProgress(90);

      // Track usage after successful generation (credits are optional on top of limits)
      await confirmUsage();
      if (!isPremium) {
        await spendCredits("ai_podcast");
      }

      const podcastTitle = scriptData.title || metadata?.videoTitle || "AI Study Podcast";

      // Save to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: saveError } = await supabase
            .from("podcasts")
            .insert([{
              user_id: user.id,
              title: podcastTitle,
              source_content: content.substring(0, 10000),
              script: JSON.parse(JSON.stringify({ segments: scriptData.segments })),
              audio_segments: JSON.parse(JSON.stringify(segments)),
              duration_seconds: segments.length * 15,
              language: settings.language || "en", // Save language for history playback
            }]);

          if (saveError) {
            console.error("Error saving podcast:", saveError);
          } else {
            setHistoryRefresh(prev => prev + 1);
          }
        }
      } catch (saveErr) {
        console.error("Error saving podcast to history:", saveErr);
      }

      // Set podcast in global context with language
      setPodcast({
        title: podcastTitle,
        segments,
        sourceContent: processedContent,
        language: settings.language || "en", // Include language for consistent voices
      });

      setGenerationStep("complete");
      setProgress(100);
      updateProgress(100);
      hideProcessing();
    } catch (error) {
      console.error("Podcast generation error:", error);
      hideProcessing();
      setErrorState("confused");
      setTimeout(() => {
        setErrorState(null);
        toast.error(error instanceof Error ? error.message : "Failed to generate podcast");
      }, 2000);
      setGenerationStep("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRaiseHand = () => {
    pause();
    setIsRaiseHandOpen(true);
  };

  const handleRaiseHandClose = () => {
    setIsRaiseHandOpen(false);
  };

  const handleResponseComplete = () => {
    setIsRaiseHandOpen(false);
    toast.success("Great question! Resuming podcast...");
  };

  const handleBack = () => {
    setPodcast(null);
    setSourceContent("");
    setGenerationStep("idle");
    setProgress(0);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleSelectSavedPodcast = (saved: SavedPodcast) => {
    const segments = saved.audio_segments || saved.script?.segments || [];
    setPodcast({
      title: saved.title,
      segments: segments as PodcastSegment[],
      sourceContent: saved.source_content || "",
      language: saved.language || "en", // Restore language for correct voice playback
    });
    setSourceContent(saved.source_content || "");
  };
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "AI Podcast", href: "/tools/podcast" },
  ];

  return (
    <AppLayout>
      <SEOHead
        title="AI Podcast"
        description="Transform your study materials into engaging podcasts with professional AI voices. Listen and learn on the go with interactive Q&A."
        canonicalPath="/tools/podcast"
        breadcrumbs={breadcrumbs}
        keywords="AI podcast, study podcast, audio learning, text to speech, educational podcast"
      />
      <div className="container max-w-4xl mx-auto px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 relative"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Podcast className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Podcast
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground px-1 sm:px-0">
            Transform your study materials into an engaging podcast with professional AI voices. 
            Raise your hand anytime to ask questions!
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {podcast && !isMinimized ? (
            <motion.div
              key="podcast"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="justify-start"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="sm:hidden">Back</span>
                  <span className="hidden sm:inline">Generate New Podcast</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMinimize}
                  className="gap-2 self-end sm:self-auto"
                >
                  <Minimize2 className="w-4 h-4" />
                  Minimize
                </Button>
              </div>

              <PodcastPlayer
                title={podcast.title}
                segments={podcast.segments}
                onRaiseHand={handleRaiseHand}
                isRaiseHandActive={isRaiseHandOpen}
                language={podcast.language}
              />

              <PodcastRaiseHand
                isOpen={isRaiseHandOpen}
                onClose={handleRaiseHandClose}
                podcastContext={sourceContent.substring(0, 2000)}
                currentTopic={podcast.title}
                onResponseComplete={handleResponseComplete}
              />
            </motion.div>
          ) : !isProcessing && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Show mini indicator if podcast is playing in background */}
              {podcast && isMinimized && (
                <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Podcast className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">"{podcast.title}" is playing</p>
                        <p className="text-xs text-muted-foreground">
                          Click to expand or use mini-player at bottom
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsMinimized(false)}
                    >
                      Expand
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Upload Your Study Material</h2>
                  {!isPremium && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {creditCost} credits
                    </span>
                  )}
                </div>

                <ContentInputTabs
                  onContentReady={handleContentReady}
                  isProcessing={isProcessing}
                />
                
                
                {/* Inline recents - just below input */}
                <InlineRecents toolId="podcast" className="mt-6 pt-6" />

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                  <div className="p-4 rounded-lg bg-primary/5">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-medium">AI-Generated Script</h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      Two hosts discuss your material naturally
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/5">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-secondary" />
                    </div>
                    <h3 className="font-medium">Professional AI Voices</h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      Studio-quality voices powered by ElevenLabs
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/5">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
                      <Podcast className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-medium">Interactive Learning</h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      Raise your hand to ask questions
                    </p>
                  </div>
                </div>
              </Card>

              {/* Study Streak Widget and Podcast History */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PodcastHistory 
                    onSelectPodcast={handleSelectSavedPodcast}
                    refreshTrigger={historyRefresh}
                  />
                </div>
                <div className="lg:col-span-1">
                  <StudyStreakWidget />
                </div>
              </div>


              {/* Promotional sections with FAQ included */}
              <ToolPagePromoSections toolId="podcast" />
            </motion.div>
          )}
        </AnimatePresence>

        <CreditModal
          open={showCreditModal}
          onOpenChange={setShowCreditModal}
          requiredCredits={creditCost}
          currentCredits={credits}
          featureName="AI Podcast"
          onWatchAd={earnCredits}
          canWatchMoreAds={canWatchMoreAds()}
          remainingAds={getRemainingAds()}
        />

        <PodcastStylePresets
          isOpen={showStylePresets}
          onClose={() => {
            setShowStylePresets(false);
            pendingContentRef.current = null;
          }}
          onGenerate={handleGenerateWithSettings}
          isFirstTimeSetup={!hasCompletedSetup}
        />

        {/* Confused Newton for errors */}
        <NewtonFeedback 
          state={errorState} 
          onDismiss={() => setErrorState(null)}
        />

        {/* Usage Limit Modal */}
        <UsageLimitModal
          open={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          featureName={getFeatureDisplayName("ai_podcast")}
          currentUsage={feature?.used || 0}
          limit={feature?.limit || 0}
          unit={feature?.unit}
          tier={subscription.tier}
          proLimit={15}
        />
      </div>
    </AppLayout>
  );
}
