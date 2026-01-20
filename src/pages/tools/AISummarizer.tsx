import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy, Check, ArrowLeft, AlertTriangle, Volume2, VolumeX, Brain, BookOpen, FileText, Network } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { VideoCardWithTools } from "@/components/VideoCardWithTools";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { QuizMode } from "@/components/QuizMode";
import { FullScreenStudyTool } from "@/components/FullScreenStudyTool";
import { VisualMindMap } from "@/components/VisualMindMap";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCredits } from "@/hooks/useCredits";
import { CreditModal } from "@/components/CreditModal";
import { FEATURE_COSTS, FEATURE_NAMES } from "@/lib/creditConfig";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import {
  processUploadedFile,
  transcribeAudio,
} from "@/utils/contentProcessing";

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

interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
  duration?: string;
  viewCount?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface FlashcardData {
  id: string;
  front: string;
  back: string;
}

interface PendingContent {
  content: string;
  type: "upload" | "recording" | "text";
  title: string;
}

const AISummarizer = () => {
  const [summary, setSummary] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const { toast } = useToast();
  const { checkCanUse, incrementUsage } = useFeatureUsage();
  const { speak, cancel, isSpeaking, isSupported } = useWebSpeechTTS();

  // Video-specific state
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");

  // Pending content state for non-YouTube content
  const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);
  const [showStudyToolsSelection, setShowStudyToolsSelection] = useState(false);
  const [pendingToolType, setPendingToolType] = useState<"quiz" | "flashcards" | "summary" | "mindmap" | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Study tools state
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [flashcardTitle, setFlashcardTitle] = useState("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryScreen, setShowSummaryScreen] = useState(false);
  const [videoSummary, setVideoSummary] = useState("");

  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [showMindMapScreen, setShowMindMapScreen] = useState(false);
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [mindMapTitle, setMindMapTitle] = useState("");

  const [activeGenerating, setActiveGenerating] = useState<"quiz" | "flashcards" | "summary" | "mindmap" | null>(null);

  // Credit modal state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  const { 
    credits, 
    hasEnoughCredits, 
    spendCredits, 
    earnCredits, 
    canWatchMoreAds, 
    getRemainingAds, 
    isPremium 
  } = useCredits();

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      cancel();
      return;
    }

    if (!summary) return;

    const cleanText = stripMarkdown(summary);
    
    try {
      await speak(cleanText, {
        rate: 1.0,
        pitch: 1.0,
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
  }, [summary, isSpeaking, speak, cancel, toast]);

  // Helper function to check and spend credits
  const trySpendCredits = async (feature: string): Promise<boolean> => {
    if (isPremium) return true;
    
    if (!hasEnoughCredits(feature)) {
      setBlockedFeature(feature);
      setShowCreditModal(true);
      return false;
    }
    
    const success = await spendCredits(feature);
    if (success) {
      const cost = FEATURE_COSTS[feature];
      toast({
        title: `${cost} credits used`,
        description: FEATURE_NAMES[feature]
      });
    }
    return success;
  };

  // Helper to extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Fetch video metadata using oEmbed
  const fetchVideoMetadata = async (videoId: string): Promise<VideoData> => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        return {
          id: videoId,
          videoId: videoId,
          title: data.title || "YouTube Video",
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          channelTitle: data.author_name || "Unknown Channel",
        };
      }
    } catch (error) {
      console.error("Error fetching video metadata:", error);
    }
    // Fallback
    return {
      id: videoId,
      videoId: videoId,
      title: "YouTube Video",
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      channelTitle: "Unknown Channel",
    };
  };

  // Helper to fetch video transcript - uses fallback when no captions available
  const fetchVideoTranscript = async (videoId: string, videoTitle: string): Promise<{ transcript: string; isLimited: boolean }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ videoId, videoTitle }),
      });

      if (!response.ok) {
        // Network/server error - use fallback
        return { transcript: `Educational video about: ${videoTitle}`, isLimited: true };
      }

      const data = await response.json();
      
      // Return transcript or fallback - don't throw error for missing captions
      if (!data.hasRealTranscript || !data.transcript) {
        return { transcript: `Educational video about: ${videoTitle}`, isLimited: true };
      }

      return { transcript: data.transcript, isLimited: false };
    } catch (error) {
      // Any error - use fallback
      console.error("Error fetching transcript, using fallback:", error);
      return { transcript: `Educational video about: ${videoTitle}`, isLimited: true };
    }
  };

  const handleContentReady = async (
    content: string,
    type: "upload" | "recording" | "youtube" | "text",
    metadata?: { file?: File; videoId?: string; videoTitle?: string; language?: string }
  ) => {
    // Store language for later use
    if (metadata?.language) {
      setSelectedLanguage(metadata.language);
    }

    // For YouTube URLs, show video card instead of immediately generating
    if (type === "youtube" && metadata?.videoId) {
      setIsLoading(true);
      setVideoError(null);
      try {
        const videoMetadata = await fetchVideoMetadata(metadata.videoId);
        setVideoData(videoMetadata);
        setSummary(null);
        setContentTitle("");
      } catch (error) {
        console.error("Error fetching video metadata:", error);
        toast({
          title: "Error",
          description: "Failed to load video information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For non-YouTube content, process and show study tools selection
    if (!checkCanUse("summary")) {
      toast({
        title: "Usage limit reached",
        description: "You've reached your monthly summarizer limit. Upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use this feature.",
          variant: "destructive",
        });
        return;
      }

      let textContent = content;
      let title = "";

      if (type === "recording") {
        const base64Audio = content.split(",")[1] || content;
        textContent = await transcribeAudio(base64Audio, session.access_token);
        title = "Audio Recording";
      } else if (type === "upload" && metadata?.file) {
        textContent = await processUploadedFile(metadata.file, session.access_token);
        title = metadata.file.name.replace(/\.[^/.]+$/, "");
      } else if (type === "text") {
        title = "Text Content";
      }

      if (!textContent?.trim()) {
        throw new Error("No content could be extracted. Please try again with different content.");
      }

      // Store processed content and show study tools selection
      setPendingContent({
        content: textContent,
        type: type as "upload" | "recording" | "text",
        title,
      });
      setShowStudyToolsSelection(true);
      setContentTitle(title);

    } catch (error: any) {
      console.error("Error processing content:", error);
      toast({
        title: "Error processing content",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tool selection from study tools bar
  const handleToolSelect = (toolType: "quiz" | "flashcards" | "summary" | "mindmap") => {
    setPendingToolType(toolType);
    setShowSettingsDialog(true);
  };

  // Handle generation after settings confirmation
  const handleConfirmGenerate = async (settings: UniversalGenerationSettings) => {
    if (!pendingContent || !pendingToolType) return;

    setShowSettingsDialog(false);

    const featureMap: Record<string, string> = {
      quiz: "quiz",
      flashcards: "flashcards",
      summary: "summary",
      mindmap: "mind_map",
    };

    const allowed = await trySpendCredits(featureMap[pendingToolType]);
    if (!allowed) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use this feature.",
        variant: "destructive",
      });
      return;
    }

    switch (pendingToolType) {
      case "quiz":
        await generateQuizFromContent(pendingContent.content, pendingContent.title, settings, session.access_token);
        break;
      case "flashcards":
        await generateFlashcardsFromContent(pendingContent.content, pendingContent.title, settings, session.access_token);
        break;
      case "summary":
        await generateSummaryFromContent(pendingContent.content, pendingContent.title, settings, session.access_token);
        break;
      case "mindmap":
        await generateMindMapFromContent(pendingContent.content, pendingContent.title, settings, session.access_token);
        break;
    }

    setPendingToolType(null);
  };

  // Generate quiz from non-YouTube content
  const generateQuizFromContent = async (content: string, title: string, settings: UniversalGenerationSettings, accessToken: string) => {
    setIsGeneratingQuiz(true);
    setActiveGenerating("quiz");
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: "text",
          title,
          content: content.slice(0, 8000),
          settings: { count: settings.count, difficulty: settings.difficulty },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate quiz");
      
      const data = await response.json();
      setQuizQuestions(data.questions);
      setQuizTitle(title);
      setShowStudyToolsSelection(false);
      toast({
        title: "Quiz Ready! 🧠",
        description: `Generated ${data.questions.length} questions`,
      });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Cannot Generate Quiz",
        description: error.message || "Failed to generate quiz",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuiz(false);
      setActiveGenerating(null);
    }
  };

  // Generate flashcards from non-YouTube content
  const generateFlashcardsFromContent = async (content: string, title: string, settings: UniversalGenerationSettings, accessToken: string) => {
    setIsGeneratingFlashcards(true);
    setActiveGenerating("flashcards");
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: "text",
          videoTitle: title,
          content: content.slice(0, 8000),
          settings: { count: settings.count, difficulty: settings.difficulty },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate flashcards");
      
      const data = await response.json();
      setFlashcards(data.flashcards);
      setFlashcardTitle(title);
      setShowStudyToolsSelection(false);
      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards`,
      });
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Cannot Generate Flashcards",
        description: error.message || "Failed to generate flashcards",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
      setActiveGenerating(null);
    }
  };

  // Generate summary from non-YouTube content
  const generateSummaryFromContent = async (content: string, title: string, settings: UniversalGenerationSettings, accessToken: string) => {
    setShowSummaryScreen(true);
    setIsGeneratingSummary(true);
    setActiveGenerating("summary");
    setContentTitle(title);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          content: content.slice(0, 10000),
          detailLevel: settings.detailLevel,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");
      
      const data = await response.json();
      setVideoSummary(data.summary);
      setShowStudyToolsSelection(false);
      toast({
        title: "Summary Ready! 📝",
        description: "Summary generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating summary:", error);
      setShowSummaryScreen(false);
      toast({
        title: "Cannot Generate Summary",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
      setActiveGenerating(null);
    }
  };

  // Generate mind map from non-YouTube content
  const generateMindMapFromContent = async (content: string, title: string, settings: UniversalGenerationSettings, accessToken: string) => {
    setShowMindMapScreen(true);
    setIsGeneratingMindMap(true);
    setActiveGenerating("mindmap");
    setMindMapTitle(title);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          content: content.slice(0, 8000),
          detailLevel: settings.detailLevel,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate mind map");
      
      const data = await response.json();
      if (data.mindMapData) {
        setMindMapData(data.mindMapData);
      }
      setShowStudyToolsSelection(false);
      toast({
        title: "Mind Map Ready! 🧠",
        description: "Mind map generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating mind map:", error);
      setShowMindMapScreen(false);
      toast({
        title: "Cannot Generate Mind Map",
        description: error.message || "Failed to generate mind map",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMindMap(false);
      setActiveGenerating(null);
    }
  };

  // Video study tool handlers
  const handleGenerateFlashcardsFromVideo = async (videoId: string, videoTitle: string, settings?: UniversalGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("flashcards");
    if (!allowed) return;
    
    setIsGeneratingFlashcards(true);
    setActiveGenerating("flashcards");
    setVideoError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const { transcript, isLimited } = await fetchVideoTranscript(videoId, videoTitle);

      if (isLimited) {
        toast({
          title: "Limited transcript",
          description: "This video has limited captions. Results are based on video topic.",
        });
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "video",
          videoTitle,
          content: transcript.slice(0, 8000),
          settings: settings ? { count: settings.count, difficulty: settings.difficulty } : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate flashcards");
      
      const data = await response.json();
      setFlashcards(data.flashcards);
      setFlashcardTitle(videoTitle);
      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards from video`,
      });
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      const errorMessage = error.message || "Failed to generate flashcards";
      setVideoError(errorMessage);
      toast({
        title: "Cannot Generate Flashcards",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
      setActiveGenerating(null);
    }
  };

  const handleGenerateQuizFromVideo = async (videoId: string, videoTitle: string, settings?: UniversalGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("quiz");
    if (!allowed) return;
    
    setIsGeneratingQuiz(true);
    setActiveGenerating("quiz");
    setVideoError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const { transcript, isLimited } = await fetchVideoTranscript(videoId, videoTitle);

      if (isLimited) {
        toast({
          title: "Limited transcript",
          description: "This video has limited captions. Results are based on video topic.",
        });
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "video",
          title: videoTitle,
          content: transcript.slice(0, 8000),
          settings: settings ? { count: settings.count, difficulty: settings.difficulty } : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate quiz");
      
      const data = await response.json();
      setQuizQuestions(data.questions);
      setQuizTitle(videoTitle);
      toast({
        title: "Quiz Ready! 🧠",
        description: `Generated ${data.questions.length} questions from video`,
      });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      const errorMessage = error.message || "Failed to generate quiz";
      setVideoError(errorMessage);
      toast({
        title: "Cannot Generate Quiz",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuiz(false);
      setActiveGenerating(null);
    }
  };

  const handleGenerateSummaryFromVideo = async (videoId: string, videoTitle: string, settings?: UniversalGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("summary");
    if (!allowed) return;
    
    setShowSummaryScreen(true);
    setIsGeneratingSummary(true);
    setActiveGenerating("summary");
    setVideoError(null);
    setContentTitle(videoTitle);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const { transcript, isLimited } = await fetchVideoTranscript(videoId, videoTitle);

      if (isLimited) {
        toast({
          title: "Limited transcript",
          description: "This video has limited captions. Results are based on video topic.",
        });
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: transcript.slice(0, 10000),
          detailLevel: settings?.detailLevel,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");
      
      const data = await response.json();
      setVideoSummary(data.summary);
      toast({
        title: "Summary Ready! 📝",
        description: "Video summary generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating summary:", error);
      setShowSummaryScreen(false);
      const errorMessage = error.message || "Failed to generate summary";
      setVideoError(errorMessage);
      toast({
        title: "Cannot Generate Summary",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
      setActiveGenerating(null);
    }
  };

  const handleGenerateMindMapFromVideo = async (videoId: string, videoTitle: string, settings?: UniversalGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("mind_map");
    if (!allowed) return;
    
    setShowMindMapScreen(true);
    setIsGeneratingMindMap(true);
    setActiveGenerating("mindmap");
    setMindMapTitle(videoTitle);
    setVideoError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const { transcript, isLimited } = await fetchVideoTranscript(videoId, videoTitle);

      if (isLimited) {
        toast({
          title: "Limited transcript",
          description: "This video has limited captions. Results are based on video topic.",
        });
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: transcript.slice(0, 8000),
          detailLevel: settings?.detailLevel,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate mind map");
      
      const data = await response.json();
      if (data.mindMapData) {
        setMindMapData(data.mindMapData);
      }
      toast({
        title: "Mind Map Ready! 🧠",
        description: "Video mind map generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating mind map:", error);
      setShowMindMapScreen(false);
      const errorMessage = error.message || "Failed to generate mind map";
      setVideoError(errorMessage);
      toast({
        title: "Cannot Generate Mind Map",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMindMap(false);
      setActiveGenerating(null);
    }
  };

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId(videoId);
  };

  const handleBackToInput = () => {
    setVideoData(null);
    setSummary(null);
    setContentTitle("");
    setVideoError(null);
    setPendingContent(null);
    setShowStudyToolsSelection(false);
  };

  const handleCloseFlashcards = () => {
    setFlashcards([]);
    setFlashcardTitle("");
  };

  const handleCloseQuiz = () => {
    setQuizQuestions([]);
    setQuizTitle("");
  };

  const handleCloseSummary = () => {
    setShowSummaryScreen(false);
    setVideoSummary("");
  };

  const handleCloseMindMap = () => {
    setShowMindMapScreen(false);
    setMindMapData(null);
    setMindMapTitle("");
  };

  const handleQuizComplete = (score: number, total: number, xpEarned: number) => {
    toast({
      title: `Quiz Complete! +${xpEarned} XP`,
      description: `You scored ${score}/${total}`,
    });
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contentTitle || "summary"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAnyGenerating = isGeneratingFlashcards || isGeneratingQuiz || isGeneratingSummary || isGeneratingMindMap;

  // Render flashcards view
  if (flashcards.length > 0) {
    return (
      <AppLayout>
        <FlashcardDeck
          flashcards={flashcards}
          title={flashcardTitle}
          onClose={handleCloseFlashcards}
        />
      </AppLayout>
    );
  }

  // Render quiz view
  if (quizQuestions.length > 0) {
    return (
      <AppLayout>
        <QuizMode
          questions={quizQuestions}
          title={quizTitle}
          onClose={handleCloseQuiz}
          onComplete={handleQuizComplete}
        />
      </AppLayout>
    );
  }

  // Render full-screen summary view
  if (showSummaryScreen) {
    return (
      <AppLayout>
        <FullScreenStudyTool
          type="summary"
          title={contentTitle}
          content={videoSummary}
          isLoading={isGeneratingSummary}
          onClose={handleCloseSummary}
        />
      </AppLayout>
    );
  }

  // Render full-screen mind map view
  if (showMindMapScreen && mindMapData) {
    return (
      <AppLayout>
        <VisualMindMap
          data={mindMapData}
          title={mindMapTitle}
          onClose={handleCloseMindMap}
        />
      </AppLayout>
    );
  }

  // Show loading state for mind map generation
  if (showMindMapScreen && isGeneratingMindMap) {
    return (
      <AppLayout>
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Generating Mind Map</h3>
            <p className="text-muted-foreground">Analyzing content...</p>
            <Button variant="outline" onClick={handleCloseMindMap}>
              Cancel
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Summarizer</h1>
          </div>
          <p className="text-muted-foreground">
            Get summaries, flashcards, quizzes, and mind maps from PDFs, YouTube videos, audio recordings, or text
          </p>
        </motion.div>

        {/* Study Tools Selection for Non-YouTube Content */}
        {showStudyToolsSelection && pendingContent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              onClick={handleBackToInput}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to input
            </Button>

            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{pendingContent.title}</CardTitle>
                <CardDescription>
                  Content processed successfully! Choose a study tool to generate:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-primary/10 hover:border-primary transition-all"
                    onClick={() => handleToolSelect("quiz")}
                    disabled={isAnyGenerating}
                  >
                    <Brain className="h-8 w-8 text-primary" />
                    <span className="font-medium">Generate Quiz</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-violet-500/10 hover:border-violet-500 transition-all"
                    onClick={() => handleToolSelect("flashcards")}
                    disabled={isAnyGenerating}
                  >
                    <BookOpen className="h-8 w-8 text-violet-500" />
                    <span className="font-medium">Generate Flashcards</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-amber-500/10 hover:border-amber-500 transition-all"
                    onClick={() => handleToolSelect("summary")}
                    disabled={isAnyGenerating}
                  >
                    <FileText className="h-8 w-8 text-amber-500" />
                    <span className="font-medium">Generate Summary</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-rose-500/10 hover:border-rose-500 transition-all"
                    onClick={() => handleToolSelect("mindmap")}
                    disabled={isAnyGenerating}
                  >
                    <Network className="h-8 w-8 text-rose-500" />
                    <span className="font-medium">Generate Mind Map</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : videoData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Button
              variant="ghost"
              onClick={handleBackToInput}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to input
            </Button>

            {/* Error Alert */}
            {videoError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cannot Process This Video</AlertTitle>
                <AlertDescription>
                  {videoError}
                  <br />
                  <span className="text-sm mt-2 block">
                    Tip: Educational videos, tutorials, and lectures usually have captions. Music videos often don't.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <VideoCardWithTools
                  video={videoData}
                  onVideoClick={handleVideoClick}
                  onGenerateFlashcards={handleGenerateFlashcardsFromVideo}
                  onGenerateQuiz={handleGenerateQuizFromVideo}
                  onGenerateSummary={handleGenerateSummaryFromVideo}
                  onGenerateMindMap={handleGenerateMindMapFromVideo}
                  isGenerating={isAnyGenerating}
                  activeGenerating={activeGenerating}
                  isLargeView={true}
                />
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Select a study tool above to generate content from this video
            </p>
          </motion.div>
        ) : (
          <>
            <ContentInputTabs
              onContentReady={handleContentReady}
              isProcessing={isLoading}
              acceptedFileTypes={{
                "application/pdf": [".pdf"],
                "image/*": [".png", ".jpg", ".jpeg", ".webp"],
                "text/plain": [".txt"],
              }}
              placeholder="Drop a PDF, image, or text file here"
              showLanguageSelector
            />

            {summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Summary</CardTitle>
                        {contentTitle && (
                          <CardDescription>{contentTitle}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {isSupported && (
                          <Button 
                            variant={isSpeaking ? "default" : "outline"} 
                            size="sm" 
                            onClick={handleReadAloud}
                            className={isSpeaking ? 'bg-primary text-primary-foreground' : ''}
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-4 w-4 mr-1" />
                            ) : (
                              <Volume2 className="h-4 w-4 mr-1" />
                            )}
                            {isSpeaking ? "Stop" : "Listen"}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                          {copied ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {copied ? "Copied" : "Copy"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MarkdownRenderer content={summary} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}

        {/* Video Player Modal */}
        {selectedVideoId && (
          <VideoPlayer
            videoId={selectedVideoId}
            onClose={() => setSelectedVideoId(null)}
          />
        )}

        {/* Credit Modal */}
        <CreditModal
          open={showCreditModal}
          onOpenChange={setShowCreditModal}
          featureName={FEATURE_NAMES[blockedFeature] || blockedFeature}
          requiredCredits={FEATURE_COSTS[blockedFeature] || 0}
          currentCredits={credits}
          onWatchAd={earnCredits}
          canWatchMoreAds={canWatchMoreAds()}
          remainingAds={getRemainingAds()}
        />

        {/* Universal Settings Dialog */}
        {pendingToolType && (
          <UniversalStudySettingsDialog
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            type={pendingToolType}
            contentTitle={pendingContent?.title}
            contentType="text"
            onGenerate={handleConfirmGenerate}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default AISummarizer;
