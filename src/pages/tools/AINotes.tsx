import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, Download, Copy, Check, Sparkles, Volume2, VolumeX, ChevronDown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureGate } from "@/components/FeatureGate";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Strip markdown formatting for cleaner TTS
const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s?/g, '') // Remove headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
    .replace(/^\s*[-*+]\s/gm, '') // List markers
    .replace(/^\s*\d+\.\s/gm, '') // Numbered lists
    .replace(/^\s*>/gm, '') // Blockquotes
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim();
};

interface PendingContent {
  content: string;
  type: string;
  metadata?: { videoId?: string; file?: File; language?: string };
}

const AINotes = () => {
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentLanguage, setContentLanguage] = useState("en");
  const { toast } = useToast();
  const { tryUseFeature, modal } = useFeatureGate("ai_notes");
  const { speak, cancel, isSpeaking, isSupported, voices, getVoicesForLanguage, setPreferredVoice, getPreferredVoice } = useWebSpeechTTS();
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);

  // Load preferred voice when language changes
  useEffect(() => {
    const preferred = getPreferredVoice(contentLanguage);
    setSelectedVoiceName(preferred);
  }, [contentLanguage, getPreferredVoice, voices]);

  // Get voices for current language
  const availableVoices = getVoicesForLanguage(contentLanguage);

  // Settings dialog state
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      cancel();
      return;
    }

    if (!notes) return;

    const cleanText = stripMarkdown(notes);
    
    try {
      await speak(cleanText, {
        language: contentLanguage,
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
  }, [notes, isSpeaking, speak, cancel, toast, contentLanguage]);

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
    
    // Store language for TTS
    if (metadata?.language) {
      setContentLanguage(metadata.language);
    }
    
    setPendingContent(null);
    setIsGenerating(true);
    setNotes("");
    cancel(); // Stop any ongoing speech

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
        throw new Error("No content to process. Please try with different content or paste text directly.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lecture-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            transcription: textContent.slice(0, 15000),
            language: metadata?.language || "en",
            detailLevel: settings.detailLevel,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate notes");

      const data = await response.json();
      setNotes(data.notes);

      toast({
        title: "Notes Generated! 📝",
        description: "Your AI notes are ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-notes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(notes);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const getContentTitle = () => {
    if (!pendingContent) return "";
    if (pendingContent.type === "youtube") return "YouTube Video";
    if (pendingContent.type === "recording") return "Audio Recording";
    if (pendingContent.metadata?.file) return pendingContent.metadata.file.name;
    return "Text Content";
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="text-center mb-4 sm:mb-8">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">AI Notes</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Give any content — textbooks, videos, slides, or recordings — and get clear, organized notes
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <ContentInputTabs
                onContentReady={handleContentReady}
                isProcessing={isGenerating}
                placeholder="Paste your lecture content, textbook excerpts, or any study material here..."
                supportedFormats="PDF, TXT, Images; Max size: 20MB"
              />
            </CardContent>
          </Card>

          {notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <h2 className="text-lg sm:text-2xl font-display font-bold tracking-tight">Generated Notes</h2>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto flex-wrap">
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
                            {isSpeaking ? (
                              <>
                                <VolumeX className="h-4 w-4" />
                                <span className="hidden sm:inline">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Read Aloud</span>
                                <span className="sm:hidden">Listen</span>
                              </>
                            )}
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
                        className="flex-1 sm:flex-none gap-2"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none gap-2">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                        <span className="sm:hidden">Save</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <MarkdownRenderer content={notes} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Settings Dialog */}
      <UniversalStudySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        type="notes"
        contentTitle={getContentTitle()}
        contentType={pendingContent?.type as any}
        onGenerate={handleConfirmGenerate}
      />

      {modal}
    </AppLayout>
  );
};

export default AINotes;
