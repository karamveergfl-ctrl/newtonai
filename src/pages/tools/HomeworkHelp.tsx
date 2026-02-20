import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolAuthGate } from "@/components/ToolAuthGate";
import { ContentDisclaimer } from "@/components/ContentDisclaimer";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Copy, Check, ImageIcon, Volume2, VolumeX, ChevronDown, Star, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { Button } from "@/components/ui/button";
import { StepBySolutionRenderer } from "@/components/StepBySolutionRenderer";
import { InlineSolutionPanel } from "@/components/InlineSolutionPanel";
import { useFeatureLimitGate, getFeatureDisplayName } from "@/hooks/useFeatureLimitGate";
import { useGuestTrial } from "@/contexts/GuestTrialContext";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import { NewtonFeedback } from "@/components/NewtonFeedback";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile,
  fileToBase64
} from "@/utils/contentProcessing";
import { cn } from "@/lib/utils";
import { ToolPagePromoSections } from "@/components/tool-sections";
import { InlineRecents } from "@/components/InlineRecents";
import { PrimaryAdBanner } from "@/components/PrimaryAdBanner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Strip markdown formatting for cleaner TTS
const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/^\s*>/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const HomeworkHelp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [copied, setCopied] = useState(false);
  const [contentLanguage, setContentLanguage] = useState("en");
  const [capturedScreenshot, setCapturedScreenshot] = useState<{ imageBase64: string; mimeType: string } | null>(null);
  const { toast } = useToast();
  
  // Use feature limit gate instead of credit gate
  const { canUse, tryUseFeature, feature, showLimitModal, setShowLimitModal, subscription } = useFeatureLimitGate("homework_help");
  const { speak, cancel, isSpeaking, isSupported, voices, getVoicesForLanguage, setPreferredVoice, getPreferredVoice } = useWebSpeechTTS();
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);

  // Global processing overlay
  const { showProcessing, hideProcessing } = useProcessingOverlay();

  // Error state for confused Newton
  const [errorState, setErrorState] = useState<"confused" | null>(null);

  // Load preferred voice when language changes
  useEffect(() => {
    const preferred = getPreferredVoice(contentLanguage);
    setSelectedVoiceName(preferred);
  }, [contentLanguage, getPreferredVoice, voices]);

  // Get voices for current language
  const availableVoices = getVoicesForLanguage(contentLanguage);

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      cancel();
      return;
    }

    if (!solution) return;

    const cleanText = stripMarkdown(solution);
    
    try {
      await speak(cleanText, {
        language: contentLanguage,
        voiceName: selectedVoiceName || undefined,
        onStart: () => {
          toast({
            title: "Reading aloud 🔊",
            description: "Tap again to stop",
          });
        },
        onError: (error) => {
          toast({
            title: "Speech Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("TTS error:", error);
    }
  }, [solution, isSpeaking, speak, cancel, toast, contentLanguage]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const allowed = await tryUseFeature();
            if (!allowed) return;

            const base64 = await fileToBase64(file);
            setCapturedScreenshot({
              imageBase64: base64.split(",")[1],
              mimeType: file.type,
            });
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [tryUseFeature]);

  // Pick up camera capture from MobileBottomNav navigation state
  useEffect(() => {
    const state = location.state as { capturedImage?: { imageBase64: string; mimeType: string } } | null;
    if (state?.capturedImage) {
      setCapturedScreenshot(state.capturedImage);
      // Clear state to prevent re-trigger on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Solution copied to clipboard" });
  };

  const { incrementGuestUsage, isAuthenticated, setShowTrialPrompt, guestLimitReached } = useGuestTrial();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    // Guest usage gate: block only if limit is reached
    if (!isAuthenticated && guestLimitReached) {
      setShowTrialPrompt(true);
      return;
    }

    const allowed = await tryUseFeature();
    if (!allowed) return;

    // Store language for TTS
    if (metadata?.language) {
      setContentLanguage(metadata.language);
    }

    if (type === "upload" && metadata?.file?.type.startsWith("image/")) {
      const base64 = await fileToBase64(metadata.file);
      setCapturedScreenshot({
        imageBase64: base64.split(",")[1],
        mimeType: metadata.file.type,
      });
      return;
    }

    // Show global processing overlay IMMEDIATELY
    setIsLoading(true);
    showProcessing({
      message: "Solving your problem...",
      subMessage: "Newton is working on a step-by-step solution",
      variant: "overlay",
    });
    
    setSolution("");
    cancel();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      let textContent = content;

      if (type === "youtube" && metadata?.videoId) {
        textContent = await getYouTubeTranscript(metadata.videoId, session.access_token);
      } else if (type === "recording") {
        textContent = await transcribeAudio(content, session.access_token);
      } else if (type === "upload" && metadata?.file) {
        textContent = await processUploadedFile(metadata.file, session.access_token);
      }

      if (!textContent?.trim()) {
        throw new Error("No content to process");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            text: textContent,
            stream: true,
            language: metadata?.language || "en",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to analyze");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  setSolution(fullContent);
                }
              } catch {}
            }
          }
        }
      }

      hideProcessing();
      // Increment guest usage after successful generation
      if (!isAuthenticated) {
        incrementGuestUsage();
      }
      toast({
        title: "Solution Ready! ✨",
        description: "Your homework has been solved",
      });
    } catch (error) {
      hideProcessing();
      setErrorState("confused");
      setTimeout(() => {
        setErrorState(null);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to solve the problem. Please try again.",
          variant: "destructive",
        });
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "Homework Help", href: "/tools/homework-help" },
  ];

  return (
    <AppLayout>
      <SEOHead
        title="Homework Helper"
        description="Get step-by-step solutions to your homework problems with AI. Upload images, PDFs, or type your questions for instant help."
        canonicalPath="/tools/homework-help"
        breadcrumbs={breadcrumbs}
        keywords="homework help, AI tutor, step-by-step solutions, math help, problem solver"
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
              <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Homework Helper</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Get step-by-step solutions to your homework problems
            </p>
            <p className="hidden md:flex text-xs text-muted-foreground mt-1 items-center justify-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Tip: Paste an image directly with Ctrl+V / Cmd+V
            </p>
          </div>

          <ToolAuthGate>
            <Card>
              <CardContent className="pt-6">
                <ContentInputTabs
                  onContentReady={handleContentReady}
                  isProcessing={isLoading}
                  placeholder="Type your homework question here..."
                  supportedFormats="Images, PDF, TXT; Max size: 20MB"
                />
                <InlineRecents toolId="homework-help" />
              </CardContent>
            </Card>
          </ToolAuthGate>

          {/* Ad Banner - Primary placement, always shows */}
          {!solution && !isLoading && <PrimaryAdBanner />}

          {/* Educational content - visible to all visitors including crawlers */}
          {!solution && !isLoading && (
            <>
              <ContentDisclaimer />
              <ToolPagePromoSections toolId="homework-help" />
            </>
          )}

          {solution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">Step-by-Step Solution</h2>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {isSupported && (
                    <div className="flex items-center gap-0">
                      <Button
                        variant={isSpeaking ? "default" : "outline"}
                        size="sm"
                        onClick={handleReadAloud}
                        className={cn(
                          "flex-1 sm:flex-none gap-2 rounded-r-none",
                          isSpeaking && 'bg-primary text-primary-foreground'
                        )}
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        <span className="sm:hidden">{isSpeaking ? "Stop" : "Listen"}</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-l-none border-l-0 px-2"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto bg-popover z-50">
                          {availableVoices.length === 0 ? (
                            <DropdownMenuItem disabled>No voices available</DropdownMenuItem>
                          ) : (
                            availableVoices.map((voice) => (
                              <DropdownMenuItem
                                key={voice.name}
                                onClick={() => {
                                  setSelectedVoiceName(voice.name);
                                  setPreferredVoice(voice.name, contentLanguage);
                                }}
                                className={cn(
                                  "cursor-pointer",
                                  selectedVoiceName === voice.name && "bg-accent"
                                )}
                              >
                                <span className="truncate max-w-[200px]">
                                  {voice.name.replace(/^(Microsoft|Google|Apple)\s+/i, "")}
                                </span>
                                {/neural|natural|premium|enhanced|wavenet/i.test(voice.name) && (
                                  <Star className="h-3 w-3 ml-1 text-primary shrink-0" />
                                )}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              
              <StepBySolutionRenderer content={solution} />
            </motion.div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {capturedScreenshot && (
          <InlineSolutionPanel
            screenshot={capturedScreenshot}
            onClose={() => setCapturedScreenshot(null)}
          />
        )}
      </AnimatePresence>

      {/* Confused Newton for errors */}
      <NewtonFeedback 
        state={errorState} 
        onDismiss={() => setErrorState(null)}
      />

      {/* Usage Limit Modal */}
      <UsageLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName={getFeatureDisplayName("homework_help")}
        currentUsage={feature?.used || 0}
        limit={feature?.limit || 0}
        unit={feature?.unit}
        tier={subscription.tier}
      />
    </AppLayout>
  );
};

export default HomeworkHelp;
