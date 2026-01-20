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
import { Progress } from "@/components/ui/progress";
import { Podcast, Sparkles, ArrowLeft, Radio, Volume2, Minimize2, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { CreditModal } from "@/components/CreditModal";
import { usePodcastContext } from "@/contexts/PodcastContext";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [sourceContent, setSourceContent] = useState("");
  const [isRaiseHandOpen, setIsRaiseHandOpen] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showStylePresets, setShowStylePresets] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const { hasEnoughCredits, spendCredits, getFeatureCost, isPremium, credits, earnCredits, canWatchMoreAds, getRemainingAds } = useCredits();
  
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

  const handleContentReady = async (
    content: string,
    type: "upload" | "recording" | "youtube" | "text",
    metadata?: { videoId?: string; videoTitle?: string; file?: File; language?: string }
  ) => {
    // Check credits first
    if (!isPremium && !hasEnoughCredits("ai_podcast")) {
      setShowCreditModal(true);
      return;
    }

    // Store content and show style presets dialog
    pendingContentRef.current = { content, type, metadata };
    setShowStylePresets(true);
  };

  const handleGenerateWithSettings = async (settings: PodcastSettings) => {
    const pending = pendingContentRef.current;
    if (!pending) return;

    const { content, type, metadata } = pending;
    pendingContentRef.current = null;

    setIsProcessing(true);
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

      // Step 2: Generate ElevenLabs audio for each segment
      setGenerationStep("voicing");
      
      let segments: PodcastSegment[] = scriptData.segments.map((segment: any) => ({
        speaker: segment.speaker,
        name: segment.name,
        text: segment.text,
        emotion: segment.emotion,
        fallbackAudio: true, // Default to Web Speech fallback
      }));

      // Try to generate ElevenLabs audio with language support
      try {
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke(
          "elevenlabs-podcast-tts",
          {
            body: { 
              segments: scriptData.segments,
              language: settings.language || "en",
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

      // Spend credits after successful generation
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
      
      const hasElevenLabsAudio = segments.some(s => s.audio);
      if (hasElevenLabsAudio) {
        toast.success("Your AI podcast with professional voices is ready!");
      } else {
        toast.success("Your AI podcast is ready! Using browser voice synthesis.");
      }
    } catch (error) {
      console.error("Podcast generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate podcast");
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

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
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
              />

              <PodcastRaiseHand
                isOpen={isRaiseHandOpen}
                onClose={handleRaiseHandClose}
                podcastContext={sourceContent.substring(0, 2000)}
                currentTopic={podcast.title}
                onResponseComplete={handleResponseComplete}
              />
            </motion.div>
          ) : isProcessing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-4 sm:p-8 text-center space-y-4 sm:space-y-6">
                <div className="relative mx-auto w-16 h-16 sm:w-24 sm:h-24">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="absolute inset-1.5 sm:inset-2 rounded-full bg-background flex items-center justify-center">
                    {generationStep === "voicing" ? (
                      <Volume2 className="w-6 h-6 sm:w-10 sm:h-10 text-primary animate-pulse" />
                    ) : generationStep === "scripting" ? (
                      <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-primary animate-pulse" />
                    ) : (
                      <Radio className="w-6 h-6 sm:w-10 sm:h-10 text-primary animate-pulse" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                    {stepMessages[generationStep]}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {generationStep === "voicing" 
                      ? "Creating professional voice audio..."
                      : "This may take a minute..."}
                  </p>
                </div>

                <div className="max-w-md mx-auto px-2">
                  <Progress value={progress} className="h-1.5 sm:h-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    {progress}% complete
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className={`flex items-center gap-1 ${generationStep === "analyzing" || generationStep === "scripting" || generationStep === "voicing" || generationStep === "complete" ? "text-primary" : ""}`}>
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${generationStep === "analyzing" ? "bg-primary animate-pulse" : progress > 0 ? "bg-primary" : "bg-muted"}`} />
                    Analyze
                  </div>
                  <div className={`flex items-center gap-1 ${generationStep === "scripting" || generationStep === "voicing" || generationStep === "complete" ? "text-primary" : ""}`}>
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${generationStep === "scripting" ? "bg-primary animate-pulse" : progress > 20 ? "bg-primary" : "bg-muted"}`} />
                    Script
                  </div>
                  <div className={`flex items-center gap-1 ${generationStep === "voicing" || generationStep === "complete" ? "text-primary" : ""}`}>
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${generationStep === "voicing" ? "bg-primary animate-pulse" : progress > 40 ? "bg-primary" : "bg-muted"}`} />
                    Voice
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
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

              <div className="mt-6">
                <PodcastHistory 
                  onSelectPodcast={handleSelectSavedPodcast}
                  refreshTrigger={historyRefresh}
                />
              </div>
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
        />
      </div>
    </AppLayout>
  );
}
