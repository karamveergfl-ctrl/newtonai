import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { PodcastRaiseHand } from "@/components/PodcastRaiseHand";
import { PodcastHistory } from "@/components/PodcastHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Podcast, Sparkles, ArrowLeft, Radio, Mic2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { CreditModal } from "@/components/CreditModal";

interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string;
}

interface PodcastData {
  title: string;
  segments: PodcastSegment[];
  id?: string;
}

interface SavedPodcast {
  id: string;
  title: string;
  script: { segments: PodcastSegment[] };
  audio_segments: PodcastSegment[] | null;
  duration_seconds: number;
  created_at: string;
  source_content: string | null;
}

type GenerationStep = "idle" | "analyzing" | "scripting" | "voicing" | "complete";

const stepMessages: Record<GenerationStep, string> = {
  idle: "",
  analyzing: "Analyzing your content...",
  scripting: "Writing podcast script...",
  voicing: "Generating voices with ElevenLabs...",
  complete: "Your podcast is ready!",
};

export default function AIPodcast() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [sourceContent, setSourceContent] = useState("");
  const [isRaiseHandOpen, setIsRaiseHandOpen] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const { hasEnoughCredits, spendCredits, getFeatureCost, isPremium, credits, earnCredits, canWatchMoreAds, getRemainingAds } = useCredits();

  const creditCost = getFeatureCost("ai_podcast");

  const handleContentReady = async (
    content: string,
    type: "upload" | "recording" | "youtube" | "text",
    metadata?: { videoId?: string; videoTitle?: string; file?: File; language?: string }
  ) => {
    // Check credits
    if (!isPremium && !hasEnoughCredits("ai_podcast")) {
      setShowCreditModal(true);
      return;
    }

    setIsProcessing(true);
    setSourceContent(content);
    setProgress(0);
    setGenerationStep("analyzing");

    try {
      // Step 1: Generate script
      setGenerationStep("scripting");
      setProgress(20);

      const { data: scriptData, error: scriptError } = await supabase.functions.invoke(
        "generate-podcast-script",
        {
          body: { content, title: metadata?.videoTitle },
        }
      );

      if (scriptError) throw scriptError;
      if (!scriptData?.segments) throw new Error("Failed to generate script");

      setProgress(40);

      // Step 2: Generate audio for each segment
      setGenerationStep("voicing");
      const segments: PodcastSegment[] = [];
      const totalSegments = scriptData.segments.length;

      for (let i = 0; i < totalSegments; i++) {
        const segment = scriptData.segments[i];
        
        try {
          const { data: ttsData, error: ttsError } = await supabase.functions.invoke(
            "elevenlabs-tts",
            {
              body: {
                text: segment.text,
                speaker: segment.speaker,
                emotion: segment.emotion,
              },
            }
          );

          if (ttsError) {
            console.error("TTS error for segment:", i, ttsError);
            segments.push(segment); // Add without audio
          } else {
            segments.push({
              ...segment,
              audio: ttsData.audio,
            });
          }
        } catch (error) {
          console.error("Error generating audio for segment:", i, error);
          segments.push(segment); // Add without audio
        }

        // Update progress
        const segmentProgress = 40 + ((i + 1) / totalSegments) * 50;
        setProgress(Math.round(segmentProgress));
      }

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

      setPodcast({
        title: podcastTitle,
        segments,
      });

      setGenerationStep("complete");
      setProgress(100);
      toast.success("Your AI podcast is ready!");
    } catch (error) {
      console.error("Podcast generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate podcast");
      setGenerationStep("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRaiseHand = () => {
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

  const handleSelectSavedPodcast = (saved: SavedPodcast) => {
    const segments = saved.audio_segments || saved.script?.segments || [];
    setPodcast({
      id: saved.id,
      title: saved.title,
      segments: segments as PodcastSegment[],
    });
    setSourceContent(saved.source_content || "");
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Podcast className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Podcast
            </h1>
          </div>
          <p className="text-muted-foreground">
            Transform your study materials into an engaging podcast with AI hosts. 
            Raise your hand anytime to ask questions!
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {podcast ? (
            <motion.div
              key="podcast"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                variant="ghost"
                className="mb-4"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Generate New Podcast
              </Button>

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
              <Card className="p-8 text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                    {generationStep === "voicing" ? (
                      <Mic2 className="w-10 h-10 text-primary animate-pulse" />
                    ) : generationStep === "scripting" ? (
                      <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                    ) : (
                      <Radio className="w-10 h-10 text-primary animate-pulse" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {stepMessages[generationStep]}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    This may take a minute...
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {progress}% complete
                  </p>
                </div>

                <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                  <div className={`flex items-center gap-1 ${generationStep === "analyzing" || generationStep === "scripting" || generationStep === "voicing" || generationStep === "complete" ? "text-primary" : ""}`}>
                    <span className={`w-2 h-2 rounded-full ${generationStep === "analyzing" ? "bg-primary animate-pulse" : progress > 0 ? "bg-primary" : "bg-muted"}`} />
                    Analyze
                  </div>
                  <div className={`flex items-center gap-1 ${generationStep === "scripting" || generationStep === "voicing" || generationStep === "complete" ? "text-primary" : ""}`}>
                    <span className={`w-2 h-2 rounded-full ${generationStep === "scripting" ? "bg-primary animate-pulse" : progress > 20 ? "bg-primary" : "bg-muted"}`} />
                    Script
                  </div>
                  <div className={`flex items-center gap-1 ${generationStep === "voicing" || generationStep === "complete" ? "text-primary" : ""}`}>
                    <span className={`w-2 h-2 rounded-full ${generationStep === "voicing" ? "bg-primary animate-pulse" : progress > 40 ? "bg-primary" : "bg-muted"}`} />
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
                      <Mic2 className="w-5 h-5 text-secondary" />
                    </div>
                    <h3 className="font-medium">Hyper-Realistic Voices</h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      Powered by ElevenLabs technology
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
      </div>
    </AppLayout>
  );
}
