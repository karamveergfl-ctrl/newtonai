import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolAuthGate } from "@/components/ToolAuthGate";
import { ContentDisclaimer } from "@/components/ContentDisclaimer";
import { AppLayout } from "@/components/AppLayout";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { ToolDemoVideo } from "@/components/ToolDemoVideo";
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
import { useGuestTrial } from "@/contexts/GuestTrialContext";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { CreditModal } from "@/components/CreditModal";
import { usePodcastContext } from "@/contexts/PodcastContext";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";
import { NewtonFeedback } from "@/components/NewtonFeedback";
import { usePodcastPreferences } from "@/hooks/usePodcastPreferences";
import { ToolPagePromoSections } from "@/components/tool-sections";
import { InlineRecents } from "@/components/InlineRecents";
import { StudyStreakWidget } from "@/components/StudyStreakWidget";
import { PrimaryAdBanner } from "@/components/PrimaryAdBanner";


interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string;
  audioUrl?: string;
  storagePath?: string | null;
  fallbackAudio?: boolean;
  audioError?: string | null;
  status?: "completed" | "failed" | "unsupported" | null;
  errorCode?: string | null;
  engine?: "kokoro" | "elevenlabs" | null;
  engineFallbackReason?: string | null;
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

// Voicing is chunked so a single edge-function call can never time out,
// and two chunks run in parallel to halve wall-clock time on long scripts.
const TTS_CHUNK_SIZE = 8;
const TTS_PARALLEL_CHUNKS = 2;

interface VoiceOptions {
  language: string;
  host1VoiceId?: string;
  host2VoiceId?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function requestVoiceChunk(chunk: PodcastSegment[], opts: VoiceOptions) {
  const { data, error } = await supabase.functions.invoke("elevenlabs-podcast-tts", {
    body: {
      segments: chunk.map((s) => ({
        speaker: s.speaker,
        name: s.name,
        text: s.text,
        emotion: s.emotion,
      })),
      language: opts.language,
      host1VoiceId: opts.host1VoiceId,
      host2VoiceId: opts.host2VoiceId,
    },
  });
  if (error) throw new Error(error.message || "Voice engine call failed");
  if (!data?.segments) throw new Error("Voice engine returned no segments");
  return data.segments as PodcastSegment[];
}

/**
 * Generates (or regenerates) audio for the given segments.
 * `indices` limits work to specific positions — used when only some segments
 * are missing audio, e.g. replaying an old episode from history.
 */
async function voiceSegments(
  segments: PodcastSegment[],
  opts: VoiceOptions,
  indices?: number[],
  onProgress?: (done: number, total: number) => void,
): Promise<PodcastSegment[]> {
  const out = segments.map((s) => ({ ...s }));
  const targets = indices ?? out.map((_, i) => i);
  if (targets.length === 0) return out;

  const chunks: number[][] = [];
  for (let i = 0; i < targets.length; i += TTS_CHUNK_SIZE) {
    chunks.push(targets.slice(i, i + TTS_CHUNK_SIZE));
  }

  let done = 0;
  for (let g = 0; g < chunks.length; g += TTS_PARALLEL_CHUNKS) {
    const group = chunks.slice(g, g + TTS_PARALLEL_CHUNKS);
    await Promise.all(
      group.map(async (positions) => {
        const chunk = positions.map((p) => out[p]);
        let voiced: PodcastSegment[] | null = null;
        let reason = "Voice engine call failed";

        // One retry — a single transient failure should not silently mute 8 segments.
        for (let attempt = 0; attempt < 2 && !voiced; attempt++) {
          try {
            voiced = await requestVoiceChunk(chunk, opts);
          } catch (err) {
            reason = err instanceof Error ? err.message : "Voice engine threw an error";
            if (attempt === 0) await sleep(800);
          }
        }

        positions.forEach((p, i) => {
          const seg = voiced?.[i];
          const ok = !!(seg?.audioUrl || seg?.storagePath);
          out[p] = seg
            ? {
                ...out[p],
                audioUrl: seg.audioUrl || undefined,
                // Durable path — signed URLs are re-issued on demand at playback.
                storagePath: seg.storagePath ?? null,
                fallbackAudio: !ok,
                status: ok ? "completed" : (seg.status ?? "failed"),
                errorCode: seg.errorCode ?? null,
                audioError: ok ? null : (seg.audioError || "Voice engine returned no audio"),
                engine: seg.engine ?? null,
                engineFallbackReason: seg.engineFallbackReason ?? null,
              }
            : {
                ...out[p],
                audioUrl: undefined,
                storagePath: out[p].storagePath ?? null,
                fallbackAudio: !out[p].storagePath,
                status: "failed",
                audioError: reason,
              };
        });

        done += positions.length;
        onProgress?.(done, targets.length);
      }),
    );
  }

  return out;
}

/** A signed URL can expire; verify before trusting a stored one. */
async function audioUrlAlive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

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
  const [userName, setUserName] = useState<string>("");
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [sourceContent, setSourceContent] = useState("");
  const [isRaiseHandOpen, setIsRaiseHandOpen] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showStylePresets, setShowStylePresets] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isRepairingAudio, setIsRepairingAudio] = useState(false);
  // Row id of the episode currently loaded, so recovered audio is persisted.
  const currentPodcastIdRef = useRef<string | null>(null);
  const { hasEnoughCredits, spendCredits, getFeatureCost, isPremium, credits } = useCredits();
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

  // Fetch user display name for personalization
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
          if (profile?.full_name) {
            setUserName(profile.full_name.split(" ")[0]); // First name only
          }
        }
      } catch { /* ignore */ }
    })();
  }, []);

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

  const { incrementGuestUsage, isAuthenticated, setShowTrialPrompt, guestLimitReached } = useGuestTrial();

  const handleContentReady = async (
    content: string,
    type: "upload" | "recording" | "youtube" | "text",
    metadata?: { videoId?: string; videoTitle?: string; file?: File; language?: string }
  ) => {
    if (!isAuthenticated && guestLimitReached) {
      setShowTrialPrompt(true);
      return;
    }

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
            userName: userName || undefined,
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
      
      const baseSegments: PodcastSegment[] = scriptData.segments.map((segment: any) => ({
        speaker: segment.speaker,
        name: segment.name,
        text: segment.text,
        emotion: segment.emotion,
        fallbackAudio: true, // Default to Web Speech fallback
        audioError: "TTS not attempted yet",
      }));

      const segments = await voiceSegments(
        baseSegments,
        {
          language: settings.language || "en",
          host1VoiceId: settings.host1VoiceId,
          host2VoiceId: settings.host2VoiceId,
        },
        undefined,
        (done, total) => {
          const pct = 40 + Math.round((done / total) * 50);
          setProgress(pct);
          updateProgress(pct);
        },
      );

      const mutedCount = segments.filter((s) => !s.audioUrl).length;
      if (mutedCount === segments.length) {
        toast.error(
          (settings.language || "en") !== "en"
            ? `AI voices aren't available for this language right now — playback will use your device voice.`
            : "Voice generation failed — playback will use your device voice.",
        );
      }

      setProgress(90);
      updateProgress(90);

      // Increment guest usage after successful generation
      if (!isAuthenticated) {
        incrementGuestUsage();
      }
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
          const { data: savedRow, error: saveError } = await supabase
            .from("podcasts")
            .insert([{
              user_id: user.id,
              title: podcastTitle,
              source_content: content.substring(0, 10000),
              script: JSON.parse(JSON.stringify({ segments: scriptData.segments })),
              audio_segments: JSON.parse(JSON.stringify(segments)),
              duration_seconds: segments.length * 15,
              language: settings.language || "en", // Save language for history playback
            }])
            .select("id")
            .maybeSingle();

          if (saveError) {
            console.error("Error saving podcast:", saveError);
          } else {
            currentPodcastIdRef.current = savedRow?.id ?? null;
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

  const handleSelectSavedPodcast = async (saved: SavedPodcast) => {
    const segments = (saved.audio_segments || saved.script?.segments || []) as PodcastSegment[];
    const language = saved.language || "en";
    currentPodcastIdRef.current = saved.id;

    setPodcast({
      title: saved.title,
      segments,
      sourceContent: saved.source_content || "",
      language, // Restore language for correct voice playback
    });
    setSourceContent(saved.source_content || "");

    // Old episodes were saved before the current voice engine worked, and signed
    // URLs can expire — re-voice anything without playable audio (cache makes repeats cheap).
    try {
      const aliveChecks = await Promise.all(
        segments.map(async (s) => {
          // A durable storage path is enough — playback re-signs the URL on demand.
          if (s.storagePath) return true;
          return s.audioUrl ? await audioUrlAlive(s.audioUrl) : false;
        }),
      );
      const missing = aliveChecks.map((ok, i) => (ok ? -1 : i)).filter((i) => i >= 0);
      if (missing.length === 0) return;

      toast.info("Restoring podcast audio...");
      const refreshed = await voiceSegments(segments, { language }, missing);
      const recovered = missing.filter((i) => refreshed[i].audioUrl || refreshed[i].storagePath).length;

      if (recovered === 0) {
        toast.error(
          language !== "en"
            ? "AI voices aren't available for this language yet."
            : "Couldn't restore the recorded audio. Try again from the player.",
        );
        return;
      }

      setPodcast({
        title: saved.title,
        segments: refreshed,
        sourceContent: saved.source_content || "",
        language,
      });
      await supabase
        .from("podcasts")
        .update({ audio_segments: JSON.parse(JSON.stringify(refreshed)) })
        .eq("id", saved.id);
      toast.success(`Restored audio for ${recovered} segment${recovered === 1 ? "" : "s"}`);
    } catch (err) {
      console.error("Failed to re-voice saved podcast:", err);
    }
  };

  /** Player-triggered repair: re-voice only the segments that still have no audio. */
  const handleRepairAudio = async () => {
    if (!podcast || isRepairingAudio) return;
    const segments = podcast.segments as PodcastSegment[];
    const missing = segments
      .map((s, i) => (s.audioUrl || s.storagePath ? -1 : i))
      .filter((i) => i >= 0);
    if (missing.length === 0) return;

    setIsRepairingAudio(true);
    try {
      const language = podcast.language || "en";
      const refreshed = await voiceSegments(segments, { language }, missing);
      const recovered = missing.filter((i) => refreshed[i].audioUrl || refreshed[i].storagePath).length;
      setPodcast({ ...podcast, segments: refreshed });

      if (currentPodcastIdRef.current) {
        await supabase
          .from("podcasts")
          .update({ audio_segments: JSON.parse(JSON.stringify(refreshed)) })
          .eq("id", currentPodcastIdRef.current);
      }

      if (recovered > 0) toast.success(`Restored audio for ${recovered} segment${recovered === 1 ? "" : "s"}`);
      else toast.error(refreshed[missing[0]]?.audioError || "Voice generation is still unavailable.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not restore audio.");
    } finally {
      setIsRepairingAudio(false);
    }
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
          className="mb-6 sm:mb-8 text-center relative"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Podcast className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">AI Podcast</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Turn study materials into engaging podcasts with AI voices
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
                onRepairAudio={handleRepairAudio}
                isRepairing={isRepairingAudio}
              />

              <PodcastRaiseHand
                isOpen={isRaiseHandOpen}
                onClose={handleRaiseHandClose}
                podcastContext={sourceContent.substring(0, 2000)}
                currentTopic={podcast.title}
                onResponseComplete={handleResponseComplete}
                userName={userName}
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

              <ToolAuthGate>
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

                  <ToolDemoVideo toolId="podcast" />
                  <ContentInputTabs
                    onContentReady={handleContentReady}
                    isProcessing={isProcessing}
                  />
                  
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
                        Studio-quality AI voices with natural delivery
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
              </ToolAuthGate>

              <PrimaryAdBanner />

              <ContentDisclaimer />
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
