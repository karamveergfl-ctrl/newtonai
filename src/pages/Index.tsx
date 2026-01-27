import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UploadZone } from "@/components/UploadZone";
import { LectureRecorder } from "@/components/LectureRecorder";

import { WelcomeModal } from "@/components/WelcomeModal";
import { NewUserWelcomeModal } from "@/components/NewUserWelcomeModal";
import { PDFReader } from "@/components/PDFReader";
import { ImageViewer } from "@/components/ImageViewer";
import { VideoPanel } from "@/components/VideoPanel";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SearchBox } from "@/components/SearchBox";
import { GlobalSearchBox } from "@/components/GlobalSearchBox";
import { SolutionPanel } from "@/components/SolutionPanel";
import { StudyTracker } from "@/components/StudyTracker";
import { PDFChat } from "@/components/PDFChat";
import { OCRSplitView } from "@/components/OCRSplitView";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { QuizMode } from "@/components/QuizMode";
import { StudyModeSelector } from "@/components/StudyModeSelector";
import { StudyToolsBar } from "@/components/StudyToolsBar";
import { FullScreenStudyTool } from "@/components/FullScreenStudyTool";
import { VisualMindMap } from "@/components/VisualMindMap";
import { GenerationSettings } from "@/components/GenerationSettingsDialog";
import { VideoGenerationSettings } from "@/components/VideoGenerationSettingsDialog";
import { UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
import { GamificationBadge } from "@/components/GamificationBadge";
import { AppLayout } from "@/components/AppLayout";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ArrowLeft, Loader2, LogOut, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCredits } from "@/hooks/useCredits";
import { CreditModal } from "@/components/CreditModal";
import { FEATURE_COSTS, FEATURE_NAMES } from "@/lib/creditConfig";
import { Session } from "@supabase/supabase-js";
import { useProcessingState } from "@/hooks/useProcessingState";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { AdBanner } from "@/components/AdBanner";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
  duration?: string;
  viewCount?: string;
}
const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [fileData, setFileData] = useState<{
    url: string;
    name: string;
    isPdf: boolean;
    isHandwritten?: boolean;
    ocrText?: string;
  } | null>(null);
  const [animationVideos, setAnimationVideos] = useState<Video[]>([]);
  const [explanationVideos, setExplanationVideos] = useState<Video[]>([]);
  const [animationNextPageToken, setAnimationNextPageToken] = useState<string | null>(null);
  const [explanationNextPageToken, setExplanationNextPageToken] = useState<string | null>(null);
  const [isLoadingMoreVideos, setIsLoadingMoreVideos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  const [solutionData, setSolutionData] = useState<{
    content: string;
    isQuestion: boolean;
    capturedImage?: string;
    isStreaming?: boolean;
  } | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showOCRView, setShowOCRView] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [flashcards, setFlashcards] = useState<{
    id: string;
    front: string;
    back: string;
  }[]>([]);
  const [flashcardTitle, setFlashcardTitle] = useState("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [totalXP, setTotalXP] = useState(() => {
    const saved = localStorage.getItem('smartreader_xp');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const [isGettingDetailed, setIsGettingDetailed] = useState(false);
  const [isSolvingSimilar, setIsSolvingSimilar] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [summary, setSummary] = useState("");
  const [mindMap, setMindMap] = useState("");
  const [videoSummary, setVideoSummary] = useState("");
  const [videoMindMap, setVideoMindMap] = useState("");
  const [isTopicSearching, setIsTopicSearching] = useState(false);
  const [activeGenerating, setActiveGenerating] = useState<"quiz" | "flashcards" | "summary" | "mindmap" | null>(null);
  const [showFullScreenMindMap, setShowFullScreenMindMap] = useState(false);
  const [fullScreenMindMapTitle, setFullScreenMindMapTitle] = useState("");
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [videoMindMapData, setVideoMindMapData] = useState<any>(null);
  const [pdfPageCount, setPdfPageCount] = useState(10);
  const [triggerScreenshot, setTriggerScreenshot] = useState(false);

  // Instant UI state - show screens immediately while loading
  const [showVideoSummaryScreen, setShowVideoSummaryScreen] = useState(false);
  const [showVideoMindMapScreen, setShowVideoMindMapScreen] = useState(false);
  const [videoStudyToolTitle, setVideoStudyToolTitle] = useState("");
  const [showFlashcardsScreen, setShowFlashcardsScreen] = useState(false);
  const [showQuizScreen, setShowQuizScreen] = useState(false);

  // Newton processing animation for video tools
  const { 
    phase: videoProcessingPhase, 
    isProcessing: isVideoProcessing, 
    startThinking: startVideoThinking, 
    startWriting: startVideoWriting, 
    complete: completeVideoProcessing, 
    reset: resetVideoProcessing 
  } = useProcessingState();
  const [videoProcessingMessage, setVideoProcessingMessage] = useState("");
  const [pendingVideoResult, setPendingVideoResult] = useState<{
    type: 'quiz' | 'flashcards' | 'summary' | 'mindmap';
    data: any;
    title: string;
  } | null>(null);

  // Credit modal state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");
  
  // New user welcome modal state
  const [showNewUserWelcome, setShowNewUserWelcome] = useState(false);
  const [newUserName, setNewUserName] = useState<string | undefined>();
  
  // Check for new signup on mount
  useEffect(() => {
    const isNewSignup = localStorage.getItem('newtonai_new_signup');
    if (isNewSignup === 'true') {
      // Delay slightly to let the page load first
      const timer = setTimeout(() => {
        setShowNewUserWelcome(true);
        localStorage.removeItem('newtonai_new_signup');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Fetch user name for welcome modal
  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setNewUserName(data.full_name);
          }
        });
    }
  }, [session?.user?.id]);

  // Lecture notes state
  const [lectureNotes, setLectureNotes] = useState("");
  const [lectureNotesTitle, setLectureNotesTitle] = useState("");
  const {
    toast
  } = useToast();

  // Handle pending video tool results after Newton animation completes
  useEffect(() => {
    if (videoProcessingPhase === 'idle' && pendingVideoResult) {
      const { type, data, title } = pendingVideoResult;
      
      switch (type) {
        case 'quiz':
          setQuizQuestions(data.questions);
          setQuizTitle(title);
          setShowQuizScreen(true);
          break;
        case 'flashcards':
          setFlashcards(data.flashcards);
          setFlashcardTitle(title);
          setShowFlashcardsScreen(true);
          break;
        case 'summary':
          setVideoSummary(data.summary);
          setVideoStudyToolTitle(title);
          setShowVideoSummaryScreen(true);
          break;
        case 'mindmap':
          setVideoMindMap(data.mindMap);
          if (data.mindMapData) setVideoMindMapData(data.mindMapData);
          setFullScreenMindMapTitle(title);
          setShowVideoMindMapScreen(true);
          break;
      }
      
      setPendingVideoResult(null);
      setIsGeneratingFlashcards(false);
      setIsGeneratingQuiz(false);
      setIsGeneratingSummary(false);
      setIsGeneratingMindMap(false);
      setActiveGenerating(null);
    }
  }, [videoProcessingPhase, pendingVideoResult, toast]);
  
  const { 
    credits, 
    hasEnoughCredits, 
    spendCredits, 
    earnCredits, 
    canWatchMoreAds, 
    getRemainingAds, 
    isPremium 
  } = useCredits();

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
  const navigate = useNavigate();
  
  // Check onboarding status and redirect if not completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();
        
        if (!profile?.onboarding_completed) {
          navigate("/onboarding");
        }
      }
    };
    checkOnboardingStatus();
  }, [session?.user?.id, navigate]);
  
  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      if (!session) {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  const handleUploadComplete = async (data: {
    pdfUrl: string;
    pdfName: string;
    isHandwritten?: boolean;
    ocrText?: string;
  }) => {
    const isPdf = data.pdfName.toLowerCase().endsWith('.pdf');
    setFileData({
      url: data.pdfUrl,
      name: data.pdfName,
      isPdf,
      isHandwritten: data.isHandwritten,
      ocrText: data.ocrText
    });
    setAnimationVideos([]);
    setExplanationVideos([]);
    setSearchQuery("");
    setSelectedVideoId(null);

    // Track study session
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: session
        } = await supabase.from("study_sessions").insert({
          user_id: user.id,
          pdf_name: data.pdfName
        }).select().single();
        setCurrentSessionId(session?.id || null);
      }
    } catch (error) {
      console.error("Error tracking session:", error);
    }
  };
  const handleSearch = async (query: string, imageData?: string) => {
    setIsSearching(true);
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // If we have image data, use analyze-text for problem solving
      if (imageData) {
        // Initialize solution panel immediately with streaming state
        setSolutionData({
          content: "",
          isQuestion: true,
          capturedImage: imageData,
          isStreaming: true
        });
        setShowVideosPanel(false);

        // Start streaming request
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`
          },
          body: JSON.stringify({
            imageData,
            stream: true
          })
        });
        if (!response.ok) {
          throw new Error("Failed to analyze text");
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let textBuffer = "";
        if (reader) {
          while (true) {
            const {
              done,
              value
            } = await reader.read();
            if (done) break;
            textBuffer += decoder.decode(value, {
              stream: true
            });

            // Process line-by-line
            let newlineIndex: number;
            while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
              let line = textBuffer.slice(0, newlineIndex);
              textBuffer = textBuffer.slice(newlineIndex + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (line.startsWith(":") || line.trim() === "") continue;
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (content) {
                  fullContent += content;
                  setSolutionData(prev => prev ? {
                    ...prev,
                    content: fullContent
                  } : null);
                }
              } catch {
                textBuffer = line + "\n" + textBuffer;
                break;
              }
            }
          }
        }

        // Mark streaming as complete
        setSolutionData(prev => prev ? {
          ...prev,
          isStreaming: false
        } : null);

        // Extract topic and fetch videos in background
        const lines = fullContent.split('\n');
        let topic = "Problem Solution";
        if (lines[0]?.startsWith("TOPIC:")) {
          topic = lines[0].replace("TOPIC:", "").trim();
          // Remove TOPIC line from displayed content
          const solutionContent = lines.slice(1).join('\n').trim();
          setSolutionData(prev => prev ? {
            ...prev,
            content: solutionContent
          } : null);
        }
        setSearchQuery(topic);

        // Fetch videos in background (non-streaming call)
        try {
          const videoResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authSession.access_token}`
            },
            body: JSON.stringify({
              imageData,
              stream: false
            })
          });
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            setAnimationVideos(videoData.animationVideos || []);
            setExplanationVideos(videoData.explanationVideos || []);
            setShowVideosPanel(true);
            toast({
              title: "Videos Found!",
              description: `Found ${videoData.explanationVideos?.length || 0} explanation videos`
            });
          }
        } catch (videoError) {
          console.error("Error fetching videos:", videoError);
        }
      } else {
        // Text-only search - use search-youtube to find videos
        setSearchQuery(query);
        setShowVideosPanel(false);
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`
          },
          body: JSON.stringify({
            query
          })
        });
        if (!response.ok) {
          throw new Error("Failed to search videos");
        }
        const data = await response.json();
        setExplanationVideos(data.videos || []);
        setAnimationVideos([]);
        setShowVideosPanel(true);
        toast({
          title: "Videos Found!",
          description: `Found ${data.videos?.length || 0} videos for "${query}"`
        });
      }

      // Track search
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("search_history").insert({
            user_id: user.id,
            search_query: query || "image analysis",
            is_question: !!imageData
          });
        }
      } catch (error) {
        console.error("Error tracking search:", error);
      }
    } catch (error) {
      console.error("Error analyzing text:", error);
      setSolutionData(null);
      toast({
        title: "Error",
        description: "Failed to search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  const handleTextSelect = (selectedText: string) => {
    handleSearch(selectedText);
  };
  const handleImageCapture = (imageData: string) => {
    handleSearch("", imageData);
  };
  const handleReset = () => {
    if (fileData?.url) {
      URL.revokeObjectURL(fileData.url);
    }
    setFileData(null);
    setAnimationVideos([]);
    setExplanationVideos([]);
    setSearchQuery("");
    setSelectedVideoId(null);
    setShowVideosPanel(false);
    setSolutionData(null);
    setPdfText("");
  };
  const handleCloseVideosPanel = () => {
    setShowVideosPanel(false);
    setSelectedVideoId(null);
  };
  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId(videoId);
  };
  const handleClosePlayer = () => {
    setSelectedVideoId(null);
  };
  const handleOCRUpload = () => {
    // If file is already loaded, use that for OCR
    if (fileData) {
      // Convert file URL to File object
      fetch(fileData.url).then(res => res.blob()).then(blob => {
        const mimeType = fileData.isPdf ? 'application/pdf' : 'image/png';
        const file = new File([blob], fileData.name, {
          type: mimeType
        });
        setOcrFile(file);
        setShowOCRView(true);
      }).catch(error => {
        console.error("Error loading file for OCR:", error);
        toast({
          title: "Error",
          description: "Failed to load file for OCR processing",
          variant: "destructive"
        });
      });
    } else {
      // No file loaded, show file picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,application/pdf";
      input.onchange = e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          setOcrFile(file);
          setShowOCRView(true);
        }
      };
      input.click();
    }
  };
  const handleCloseOCR = () => {
    setShowOCRView(false);
    setOcrFile(null);
  };

  // Helper function to fetch video transcript
  const fetchVideoTranscript = async (videoId: string, videoTitle: string): Promise<string> => {
    const {
      data: {
        session: authSession
      }
    } = await supabase.auth.getSession();
    if (!authSession?.access_token) {
      throw new Error("Not authenticated");
    }
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-transcript`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authSession.access_token}`
      },
      body: JSON.stringify({
        videoId,
        videoTitle
      })
    });
    if (!response.ok) {
      // Fallback to video title if transcript fetch fails
      return `Educational video about: ${videoTitle}`;
    }
    const data = await response.json();
    return data.transcript || `Educational video about: ${videoTitle}`;
  };
  const handleGenerateFlashcardsFromVideo = async (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("flashcards");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating flashcards from video...");
    startVideoThinking();
    setActiveGenerating("flashcards");
    setIsGeneratingFlashcards(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // Fetch transcript (thinking phase)
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: "video",
          videoTitle,
          content: transcript.slice(0, 8000),
          settings: settings ? {
            count: settings.count,
            difficulty: settings.difficulty
          } : undefined
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'flashcards', data, title: videoTitle });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating flashcards:", error);
      resetVideoProcessing();
      setIsGeneratingFlashcards(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive"
      });
    }
  };
  const handleGenerateFlashcardsFromContent = async (settings?: GenerationSettings) => {
    if (!pdfText && !fileData?.ocrText) {
      toast({
        title: "No content",
        description: "Please upload a document first",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("flashcards");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating flashcards from document...");
    startVideoThinking();
    setActiveGenerating("flashcards");
    setIsGeneratingFlashcards(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const content = pdfText || fileData?.ocrText || "";
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: fileData?.isPdf ? "pdf" : "image",
          content: content.slice(0, 8000),
          settings
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'flashcards', data, title: fileData?.name || "Document Flashcards" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating flashcards:", error);
      resetVideoProcessing();
      setIsGeneratingFlashcards(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive"
      });
    }
  };
  const handleCloseFlashcards = () => {
    setShowFlashcardsScreen(false);
    setFlashcards([]);
    setFlashcardTitle("");
  };
  const handleGenerateQuizFromVideo = async (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("quiz");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating quiz from video...");
    startVideoThinking();
    setActiveGenerating("quiz");
    setIsGeneratingQuiz(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // Fetch transcript (thinking phase)
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: "video",
          title: videoTitle,
          content: transcript.slice(0, 8000),
          settings: settings ? {
            count: settings.count,
            difficulty: settings.difficulty
          } : undefined
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'quiz', data, title: videoTitle });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating quiz:", error);
      resetVideoProcessing();
      setIsGeneratingQuiz(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive"
      });
    }
  };
  const handleGenerateSummaryFromVideo = async (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("summary");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating summary from video...");
    startVideoThinking();
    setActiveGenerating("summary");
    setIsGeneratingSummary(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // Fetch transcript (thinking phase)
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: transcript.slice(0, 10000),
          detailLevel: settings?.detailLevel || "standard",
          format: settings?.summaryFormat || "concise",
          includeComparison: settings?.includeComparison ?? true
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'summary', data, title: videoTitle });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating summary:", error);
      resetVideoProcessing();
      setIsGeneratingSummary(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive"
      });
    }
  };
  const handleGenerateMindMapFromVideo = async (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => {
    // Check and spend credits first
    const allowed = await trySpendCredits("mind_map");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating mind map from video...");
    startVideoThinking();
    setActiveGenerating("mindmap");
    setIsGeneratingMindMap(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // Fetch transcript (thinking phase)
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: transcript.slice(0, 8000),
          detailLevel: settings?.detailLevel
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate mind map");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'mindmap', data, title: videoTitle });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating mind map:", error);
      resetVideoProcessing();
      setIsGeneratingMindMap(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate mind map",
        variant: "destructive"
      });
    }
  };
  const handleGenerateQuizFromContent = async (settings?: GenerationSettings) => {
    if (!pdfText && !fileData?.ocrText) {
      toast({
        title: "No content",
        description: "Please upload a document first",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("quiz");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating quiz from document...");
    startVideoThinking();
    setActiveGenerating("quiz");
    setIsGeneratingQuiz(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const content = pdfText || fileData?.ocrText || "";
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: fileData?.isPdf ? "pdf" : "image",
          content: content.slice(0, 8000),
          title: fileData?.name,
          settings
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'quiz', data, title: fileData?.name || "Document Quiz" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating quiz:", error);
      resetVideoProcessing();
      setIsGeneratingQuiz(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive"
      });
    }
  };
  const handleCloseQuiz = () => {
    setShowQuizScreen(false);
    setQuizQuestions([]);
    setQuizTitle("");
  };
  const handleQuizComplete = (score: number, total: number, xpEarned: number) => {
    const newXP = totalXP + xpEarned;
    setTotalXP(newXP);
    localStorage.setItem('smartreader_xp', newXP.toString());
    toast({
      title: `+${xpEarned} XP Earned! 🎮`,
      description: `Total XP: ${newXP}`
    });
  };
  const handleFollowUpQuestion = async (question: string) => {
    if (!solutionData) return;
    setIsAnsweringFollowUp(true);
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solution-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          imageData: solutionData.capturedImage,
          currentSolution: solutionData.content,
          question
        })
      });
      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      let textBuffer = "";
      if (reader) {
        while (true) {
          const {
            done,
            value
          } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, {
            stream: true
          });
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                answer += content;
                setSolutionData(prev => prev ? {
                  ...prev,
                  content: prev.content + "\n\n---\n\n**Follow-up:** " + question + "\n\n" + answer
                } : null);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      // Final update with complete answer
      setSolutionData(prev => prev ? {
        ...prev,
        content: prev.content.includes("**Follow-up:**") ? prev.content : prev.content + "\n\n---\n\n**Follow-up:** " + question + "\n\n" + answer
      } : null);
    } catch (error) {
      console.error("Error with follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to answer follow-up question",
        variant: "destructive"
      });
    } finally {
      setIsAnsweringFollowUp(false);
    }
  };
  const handleFindSimilar = async () => {
    if (!searchQuery) return;
    setIsFindingSimilar(true);
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-similar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          topic: searchQuery,
          problemType: solutionData?.isQuestion ? "numerical" : "concept",
          currentSolution: solutionData?.content?.slice(0, 2000)
        })
      });
      if (!response.ok) {
        throw new Error("Failed to find similar questions");
      }
      const data = await response.json();

      // Append similar problems to the solution panel
      if (data.similarProblems) {
        setSolutionData(prev => prev ? {
          ...prev,
          content: prev.content + "\n\n---\n\n# 📝 Practice These Similar Problems\n\n" + data.similarProblems
        } : null);
      }

      // Replace current videos with similar problem videos
      if (data.videos?.length > 0) {
        setExplanationVideos(data.videos);
        setAnimationVideos([]);
        setShowVideosPanel(true);
      }
      toast({
        title: "Practice Problem Found! 📚",
        description: `Generated 1 practice problem + ${data.videos?.length || 0} video solutions`
      });
    } catch (error) {
      console.error("Error finding similar:", error);
      toast({
        title: "Error",
        description: "Failed to find similar questions",
        variant: "destructive"
      });
    } finally {
      setIsFindingSimilar(false);
    }
  };
  const handleGetDetailedSolution = async () => {
    if (!solutionData) return;
    setIsGettingDetailed(true);
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detailed-solution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          imageData: solutionData.capturedImage,
          currentSolution: solutionData.content
        })
      });
      if (!response.ok) {
        throw new Error("Failed to get detailed solution");
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let detailed = "";
      let textBuffer = "";

      // Clear current solution and start fresh with detailed
      setSolutionData(prev => prev ? {
        ...prev,
        content: "",
        isStreaming: true
      } : null);
      if (reader) {
        while (true) {
          const {
            done,
            value
          } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, {
            stream: true
          });
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                detailed += content;
                setSolutionData(prev => prev ? {
                  ...prev,
                  content: detailed,
                  isStreaming: true
                } : null);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      // Final update
      setSolutionData(prev => prev ? {
        ...prev,
        content: detailed,
        isStreaming: false
      } : null);
    } catch (error) {
      console.error("Error getting detailed solution:", error);
      toast({
        title: "Error",
        description: "Failed to get detailed solution",
        variant: "destructive"
      });
    } finally {
      setIsGettingDetailed(false);
    }
  };
  const handleSolveSimilar = async (problemText: string) => {
    setIsSolvingSimilar(true);
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // Clear the similar problem section and show new streaming solution
      setSolutionData(prev => prev ? {
        ...prev,
        content: "",
        isStreaming: true
      } : null);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detailed-solution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          problemText,
          isSimilarProblem: true
        })
      });
      if (!response.ok) {
        throw new Error("Failed to solve problem");
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let solution = "";
      let textBuffer = "";
      if (reader) {
        while (true) {
          const {
            done,
            value
          } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, {
            stream: true
          });
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                solution += content;
                setSolutionData(prev => prev ? {
                  ...prev,
                  content: solution,
                  isStreaming: true
                } : null);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      // Final update
      setSolutionData(prev => prev ? {
        ...prev,
        content: solution,
        isStreaming: false
      } : null);
      toast({
        title: "Practice Problem Solved! ✅",
        description: "Step-by-step solution ready"
      });
    } catch (error) {
      console.error("Error solving similar problem:", error);
      toast({
        title: "Error",
        description: "Failed to solve practice problem",
        variant: "destructive"
      });
    } finally {
      setIsSolvingSimilar(false);
    }
  };
  const handleGenerateSummary = async () => {
    const content = pdfText || fileData?.ocrText || "";
    if (!content) {
      toast({
        title: "No content",
        description: "Please upload a document first",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("summary");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating notes from document...");
    startVideoThinking();
    setActiveGenerating("summary");
    setIsGeneratingSummary(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: content.slice(0, 10000)
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation - use videoSummary for unified flow
      setPendingVideoResult({ type: 'summary', data, title: fileData?.name || "Document Notes" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating summary:", error);
      resetVideoProcessing();
      setIsGeneratingSummary(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate notes",
        variant: "destructive"
      });
    }
  };
  const handleGenerateMindMap = async () => {
    const content = pdfText || fileData?.ocrText || "";
    if (!content) {
      toast({
        title: "No content",
        description: "Please upload a document first",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("mind_map");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating mind map from document...");
    startVideoThinking();
    setActiveGenerating("mindmap");
    setIsGeneratingMindMap(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: content.slice(0, 8000)
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate mind map");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'mindmap', data: { mindMap: data.mindMap, mindMapData: data.mindMapData }, title: fileData?.name || "Document Mind Map" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating mind map:", error);
      resetVideoProcessing();
      setIsGeneratingMindMap(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate mind map",
        variant: "destructive"
      });
    }
  };

  // Generate study tools from selected text - using Newton animation pattern
  const handleGenerateQuizFromText = async (selectedText: string, settings?: UniversalGenerationSettings) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate a quiz",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("quiz");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating quiz from selected text...");
    startVideoThinking();
    setActiveGenerating("quiz");
    setIsGeneratingQuiz(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: "text",
          content: selectedText,
          title: "Selected Text Quiz",
          settings: settings ? {
            count: settings.count,
            difficulty: settings.difficulty
          } : undefined
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'quiz', data, title: "Quiz from Selected Text" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating quiz from text:", error);
      resetVideoProcessing();
      setIsGeneratingQuiz(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive"
      });
    }
  };
  const handleGenerateFlashcardsFromText = async (selectedText: string, settings?: UniversalGenerationSettings) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate flashcards",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("flashcards");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating flashcards from selected text...");
    startVideoThinking();
    setActiveGenerating("flashcards");
    setIsGeneratingFlashcards(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: "text",
          content: selectedText,
          title: "Selected Text",
          settings: settings ? {
            count: settings.count,
            difficulty: settings.difficulty
          } : undefined
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'flashcards', data, title: "Flashcards from Selected Text" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating flashcards from text:", error);
      resetVideoProcessing();
      setIsGeneratingFlashcards(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive"
      });
    }
  };
  const handleGenerateSummaryFromText = async (selectedText: string, settings?: UniversalGenerationSettings) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate a summary",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("summary");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating summary from selected text...");
    startVideoThinking();
    setActiveGenerating("summary");
    setIsGeneratingSummary(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: selectedText,
          detailLevel: settings?.detailLevel || "standard",
          format: settings?.summaryFormat || "concise",
          includeComparison: settings?.includeComparison ?? true
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'summary', data, title: "Summary from Selected Text" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating summary from text:", error);
      resetVideoProcessing();
      setIsGeneratingSummary(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive"
      });
    }
  };
  const handleGenerateMindMapFromText = async (selectedText: string, settings?: UniversalGenerationSettings) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate a mind map",
        variant: "destructive"
      });
      return;
    }
    
    // Check and spend credits first
    const allowed = await trySpendCredits("mind_map");
    if (!allowed) return;
    
    // Start Newton animation
    setVideoProcessingMessage("Generating mind map from selected text...");
    startVideoThinking();
    setActiveGenerating("mindmap");
    setIsGeneratingMindMap(true);
    
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Switch to writing phase
      startVideoWriting();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: selectedText,
          detailLevel: settings?.detailLevel
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate mind map");
      }
      const data = await response.json();
      
      // Store result and trigger completion animation
      setPendingVideoResult({ type: 'mindmap', data, title: "Mind Map from Selected Text" });
      completeVideoProcessing();
    } catch (error) {
      console.error("Error generating mind map from text:", error);
      resetVideoProcessing();
      setIsGeneratingMindMap(false);
      setActiveGenerating(null);
      toast({
        title: "Error",
        description: "Failed to generate mind map",
        variant: "destructive"
      });
    }
  };

  // Global topic search - searches YouTube without document
  const handleTopicSearch = async (topic: string) => {
    setIsTopicSearching(true);
    setSearchQuery(topic);
    setAnimationVideos([]);
    setExplanationVideos([]);
    setAnimationNextPageToken(null);
    setExplanationNextPageToken(null);
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // Fetch both animation and explanation videos in parallel
      const [animationResponse, explanationResponse] = await Promise.all([fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          query: topic,
          type: "animation"
        })
      }), fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          query: topic,
          type: "explanation"
        })
      })]);
      if (!animationResponse.ok || !explanationResponse.ok) {
        throw new Error("Failed to search videos");
      }
      const [animationData, explanationData] = await Promise.all([animationResponse.json(), explanationResponse.json()]);
      setAnimationVideos(animationData.videos || []);
      setExplanationVideos(explanationData.videos || []);
      setAnimationNextPageToken(animationData.nextPageToken || null);
      setExplanationNextPageToken(explanationData.nextPageToken || null);
      setShowVideosPanel(true);
      toast({
        title: "Videos Found!",
        description: `Found ${animationData.videos?.length || 0} animations and ${explanationData.videos?.length || 0} explanations`
      });
    } catch (error) {
      console.error("Error searching topic:", error);
      toast({
        title: "Error",
        description: "Failed to search videos",
        variant: "destructive"
      });
    } finally {
      setIsTopicSearching(false);
    }
  };

  // Load more videos for pagination
  const handleLoadMoreVideos = async (type: "animation" | "explanation") => {
    const pageToken = type === "animation" ? animationNextPageToken : explanationNextPageToken;
    if (!pageToken || isLoadingMoreVideos) return;
    setIsLoadingMoreVideos(true);
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          query: searchQuery,
          type,
          pageToken
        })
      });
      if (!response.ok) {
        throw new Error("Failed to load more videos");
      }
      const data = await response.json();
      if (type === "animation") {
        setAnimationVideos(prev => [...prev, ...(data.videos || [])]);
        setAnimationNextPageToken(data.nextPageToken || null);
      } else {
        setExplanationVideos(prev => [...prev, ...(data.videos || [])]);
        setExplanationNextPageToken(data.nextPageToken || null);
      }
      toast({
        title: "More Videos Loaded",
        description: `Loaded ${data.videos?.length || 0} more videos`
      });
    } catch (error) {
      console.error("Error loading more videos:", error);
      toast({
        title: "Error",
        description: "Failed to load more videos",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMoreVideos(false);
    }
  };

  // Handler for sidebar tool selection
  const handleSidebarToolSelect = (tool: string) => {
    switch (tool) {
      case "homework":
        // Focus on search/upload for homework help
        break;
      case "notes":
        // Open lecture recorder
        break;
      case "flashcards":
        if (pdfText) handleGenerateFlashcardsFromText(pdfText);
        break;
      case "quiz":
        if (pdfText) handleGenerateQuizFromText(pdfText);
        break;
      case "summary":
        if (pdfText) handleGenerateSummaryFromText(pdfText);
        break;
      case "video":
        // Scroll to video section
        break;
      case "lecture":
        // Focus on lecture recorder
        break;
      case "mindmap":
        if (pdfText) handleGenerateMindMapFromText(pdfText);
        break;
      default:
        break;
    }
  };
  if (!session) {
    return null; // Auth redirect will happen in useEffect
  }
  if (!fileData) {
  const triggerUploadClick = () => {
    const uploadZone = document.querySelector("[data-tutorial='upload-zone']") as HTMLElement;
    uploadZone?.click();
  };

  const triggerRecordClick = () => {
    const recordButton = document.querySelector("[data-action='record-lecture']") as HTMLElement;
    recordButton?.click();
  };

  return <>
      {/* Newton Processing Overlay - Top Level */}
      {isVideoProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <ProcessingOverlay
            isVisible={isVideoProcessing}
            message={videoProcessingMessage}
            variant="card"
          />
        </div>
      )}
      
      <AppLayout onToolSelect={handleSidebarToolSelect} onSignOut={handleSignOut}>
        
        <WelcomeModal onUploadClick={triggerUploadClick} onRecordClick={triggerRecordClick} />
        <div className="flex-1 bg-gradient-to-br from-background via-background to-primary/5 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <GlobalSearchBox onTopicSearch={handleTopicSearch} isSearching={isTopicSearching} />
            {showVideosPanel && <div className="mt-8 animate-fade-in">
                <VideoPanel animationVideos={animationVideos} explanationVideos={explanationVideos} searchQuery={searchQuery} onVideoClick={handleVideoClick} onClose={handleCloseVideosPanel} onGenerateFlashcards={handleGenerateFlashcardsFromVideo} onGenerateQuiz={handleGenerateQuizFromVideo} onGenerateSummary={handleGenerateSummaryFromVideo} onGenerateMindMap={handleGenerateMindMapFromVideo} isGenerating={isGeneratingFlashcards || isGeneratingQuiz || isGeneratingSummary || isGeneratingMindMap} activeGenerating={activeGenerating} onLoadMore={handleLoadMoreVideos} isLoadingMore={isLoadingMoreVideos} hasMoreAnimation={!!animationNextPageToken} hasMoreExplanation={!!explanationNextPageToken} />
              </div>}
            <div className="mt-8 space-y-6 my-[3px]">
              <StudyTracker />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UploadZone onUploadComplete={handleUploadComplete} />
                <LectureRecorder onNotesGenerated={(notes, title) => {
                setLectureNotes(notes);
                setLectureNotesTitle(title);
              }} />
              </div>
            </div>
          </div>
          {selectedVideoId && <VideoPlayer videoId={selectedVideoId} onClose={handleClosePlayer} />}
          {showOCRView && ocrFile && <OCRSplitView file={ocrFile} onClose={handleCloseOCR} onTextSelect={handleSearch} />}
          {lectureNotes && <FullScreenStudyTool type="summary" title={lectureNotesTitle || "Lecture Notes"} content={lectureNotes} onClose={() => {
          setLectureNotes("");
          setLectureNotesTitle("");
        }} />}
        
          {/* Flashcard Deck for topic search */}
          {(showFlashcardsScreen || flashcards.length > 0) && <FlashcardDeck flashcards={flashcards} title={flashcardTitle} onClose={handleCloseFlashcards} isLoading={isGeneratingFlashcards} />}
          
          {/* Quiz Mode for topic search */}
          {(showQuizScreen || quizQuestions.length > 0) && <QuizMode questions={quizQuestions} title={quizTitle} onClose={handleCloseQuiz} onComplete={handleQuizComplete} isLoading={isGeneratingQuiz} />}

          {/* Video Summary for topic search */}
          {(showVideoSummaryScreen || videoSummary) && <FullScreenStudyTool type="summary" title={videoStudyToolTitle || "Video Summary"} content={videoSummary} onClose={() => {
          setShowVideoSummaryScreen(false);
          setVideoSummary("");
        }} isLoading={isGeneratingSummary} loadingMessage="Analyzing video content and creating summary..." />}

          {/* Video Mind Map for topic search */}
          {(showVideoMindMapScreen || videoMindMap) && (isGeneratingMindMap ? <FullScreenStudyTool type="mindmap" title={videoStudyToolTitle || "Video Mind Map"} content="" onClose={() => {
          setShowVideoMindMapScreen(false);
          setVideoMindMap("");
          setVideoMindMapData(null);
        }} isLoading={true} loadingMessage="Analyzing video content and creating mind map..." /> : videoMindMapData ? <VisualMindMap data={videoMindMapData} title={fullScreenMindMapTitle || "Video Mind Map"} onClose={() => {
          setShowVideoMindMapScreen(false);
          setVideoMindMap("");
          setVideoMindMapData(null);
        }} showVideoSlide={showVideosPanel} /> : videoMindMap ? <FullScreenStudyTool type="mindmap" title={fullScreenMindMapTitle || "Video Mind Map"} content={videoMindMap} onClose={() => {
          setShowVideoMindMapScreen(false);
          setVideoMindMap("");
        }} showVideoSlide={showVideosPanel} /> : null)}

          {/* Empty - ProcessingOverlay moved to top level */}
        </div>
      </AppLayout>
    </>;
  }
  return <>
    {/* Newton Processing Overlay - Top Level */}
    {isVideoProcessing && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <ProcessingOverlay
          isVisible={isVideoProcessing}
          message={videoProcessingMessage}
          variant="card"
        />
      </div>
    )}
    
    <AppLayout onToolSelect={handleSidebarToolSelect} onSignOut={handleSignOut}>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-gradient-to-br from-background via-background to-primary/5">
        {/* Compact Header */}
        <div className="p-2 md:p-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button onClick={handleReset} variant="ghost" size="sm" className="gap-1 h-8 shrink-0">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">New File</span>
              </Button>
              <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                {fileData.name}
              </h1>
            </div>
            {isSearching && <div className="flex items-center gap-2 text-primary shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Searching...</span>
              </div>}
          </div>
        </div>

        {/* Study Tools Bar - Compact Row */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-card/80 to-card/40 border-b backdrop-blur-sm w-fit rounded-b-lg shadow-sm">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full">
            <span className="text-sm font-bold text-primary uppercase tracking-wide">Tools</span>
          </div>
          <StudyToolsBar onGenerateQuiz={handleGenerateQuizFromContent} onGenerateFlashcards={handleGenerateFlashcardsFromContent} onGenerateSummary={handleGenerateSummary} onGenerateMindMap={handleGenerateMindMap} onScreenshot={() => setTriggerScreenshot(true)} isGeneratingQuiz={isGeneratingQuiz} isGeneratingFlashcards={isGeneratingFlashcards} isGeneratingSummary={isGeneratingSummary} isGeneratingMindMap={isGeneratingMindMap} disabled={!pdfText && !fileData?.ocrText} totalPages={pdfPageCount} className="border-0 p-0 bg-transparent" />
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Conditional rendering: Show PDF/Image or Search Results */}
          {!showVideosPanel && !solutionData ?
        // File View with Search and Chat
        <div className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden animate-fade-in min-h-0">
              <div className="flex-1 overflow-hidden min-h-0">
                {fileData.isPdf ? <PDFReader pdfUrl={fileData.url} onTextSelect={handleTextSelect} onImageCapture={handleImageCapture} onPdfTextExtracted={setPdfText} triggerScreenshot={triggerScreenshot} onScreenshotTriggered={() => setTriggerScreenshot(false)} onGenerateQuizFromText={handleGenerateQuizFromText} onGenerateFlashcardsFromText={handleGenerateFlashcardsFromText} onGenerateSummaryFromText={handleGenerateSummaryFromText} onGenerateMindMapFromText={handleGenerateMindMapFromText} isGeneratingQuiz={isGeneratingQuiz} isGeneratingFlashcards={isGeneratingFlashcards} isGeneratingSummary={isGeneratingSummary} isGeneratingMindMap={isGeneratingMindMap} isSearching={isSearching} /> : <ImageViewer imageUrl={fileData.url} imageName={fileData.name} ocrText={fileData.ocrText} onTextSelect={handleTextSelect} onImageCapture={handleImageCapture} onGenerateQuizFromText={handleGenerateQuizFromText} onGenerateFlashcardsFromText={handleGenerateFlashcardsFromText} onGenerateSummaryFromText={handleGenerateSummaryFromText} onGenerateMindMapFromText={handleGenerateMindMapFromText} isGeneratingQuiz={isGeneratingQuiz} isGeneratingFlashcards={isGeneratingFlashcards} isGeneratingSummary={isGeneratingSummary} isGeneratingMindMap={isGeneratingMindMap} isSearching={isSearching} />}
              </div>
              {fileData.isPdf && <PDFChat pdfText={pdfText} pdfName={fileData.name} />}
            </div> :
        // Search Results View: Resizable panels for Solution and Videos
        <ResizablePanelGroup direction="horizontal" className="flex-1 animate-fade-in">
              {/* Solution Panel */}
              {solutionData && <>
                  <ResizablePanel defaultSize={50} minSize={20}>
                    <SolutionPanel content={solutionData.content} isQuestion={solutionData.isQuestion} onClose={() => setSolutionData(null)} capturedImage={solutionData.capturedImage} isStreaming={solutionData.isStreaming} onFollowUpQuestion={handleFollowUpQuestion} isAnswering={isAnsweringFollowUp} onFindSimilar={handleFindSimilar} isFindingSimilar={isFindingSimilar} onGetDetailedSolution={handleGetDetailedSolution} isGettingDetailed={isGettingDetailed} onSolveSimilar={handleSolveSimilar} isSolvingSimilar={isSolvingSimilar} />
                  </ResizablePanel>
                  {showVideosPanel && <ResizableHandle withHandle />}
                </>}
              
              {/* Video Panel */}
              {showVideosPanel && <ResizablePanel defaultSize={solutionData ? 50 : 100} minSize={20}>
                  <div className="h-full bg-card/30 backdrop-blur-sm">
                    <VideoPanel animationVideos={animationVideos} explanationVideos={explanationVideos} searchQuery={searchQuery} onVideoClick={handleVideoClick} onClose={handleCloseVideosPanel} onGenerateFlashcards={handleGenerateFlashcardsFromVideo} onGenerateQuiz={handleGenerateQuizFromVideo} onGenerateSummary={handleGenerateSummaryFromVideo} onGenerateMindMap={handleGenerateMindMapFromVideo} isGenerating={isGeneratingFlashcards || isGeneratingQuiz || isGeneratingSummary || isGeneratingMindMap} activeGenerating={activeGenerating} defaultTab="explanation" onLoadMore={handleLoadMoreVideos} isLoadingMore={isLoadingMoreVideos} hasMoreAnimation={!!animationNextPageToken} hasMoreExplanation={!!explanationNextPageToken} />
                  </div>
                </ResizablePanel>}
            </ResizablePanelGroup>}
          
          {/* Fullscreen Video Player */}
          {selectedVideoId && <VideoPlayer videoId={selectedVideoId} onClose={handleClosePlayer} />}
          
          {/* OCR Split View */}
          {showOCRView && ocrFile && <OCRSplitView file={ocrFile} onClose={handleCloseOCR} onTextSelect={handleSearch} />}
          
          {/* Flashcard Deck */}
          {(showFlashcardsScreen || flashcards.length > 0) && <FlashcardDeck flashcards={flashcards} title={flashcardTitle} onClose={handleCloseFlashcards} isLoading={isGeneratingFlashcards} />}
          
          {/* Quiz Mode */}
          {(showQuizScreen || quizQuestions.length > 0) && <QuizMode questions={quizQuestions} title={quizTitle} onClose={handleCloseQuiz} onComplete={handleQuizComplete} isLoading={isGeneratingQuiz} />}

          {/* Summary Half-Screen (Right Side) */}
          {summary && <FullScreenStudyTool type="summary" title={fileData?.name || "Document Summary"} content={summary} onClose={() => setSummary("")} />}

          {/* Mind Map Full Screen - Visual or Text */}
          {mindMap && (mindMapData ? <VisualMindMap data={mindMapData} title={fileData?.name || "Document Mind Map"} onClose={() => {
          setMindMap("");
          setMindMapData(null);
        }} /> : <FullScreenStudyTool type="mindmap" title={fileData?.name || "Document Mind Map"} content={mindMap} onClose={() => setMindMap("")} />)}

          {/* Video Summary Half-Screen - Shows immediately with loading */}
          {(showVideoSummaryScreen || videoSummary) && <FullScreenStudyTool type="summary" title={videoStudyToolTitle || "Video Summary"} content={videoSummary} onClose={() => {
          setShowVideoSummaryScreen(false);
          setVideoSummary("");
        }} isLoading={isGeneratingSummary} loadingMessage="Analyzing video content and creating summary..." />}

          {/* Video Mind Map Full Screen - Shows immediately with loading */}
          {(showVideoMindMapScreen || videoMindMap) && (isGeneratingMindMap ? <FullScreenStudyTool type="mindmap" title={videoStudyToolTitle || "Video Mind Map"} content="" onClose={() => {
          setShowVideoMindMapScreen(false);
          setVideoMindMap("");
          setVideoMindMapData(null);
        }} isLoading={true} loadingMessage="Analyzing video content and creating mind map..." /> : videoMindMapData ? <VisualMindMap data={videoMindMapData} title={fullScreenMindMapTitle || "Video Mind Map"} onClose={() => {
          setShowVideoMindMapScreen(false);
          setVideoMindMap("");
          setVideoMindMapData(null);
        }} showVideoSlide={showVideosPanel} /> : videoMindMap ? <FullScreenStudyTool type="mindmap" title={fullScreenMindMapTitle || "Video Mind Map"} content={videoMindMap} onClose={() => {
          setShowVideoMindMapScreen(false);
          setVideoMindMap("");
        }} showVideoSlide={showVideosPanel} /> : null)}

          {/* Empty - ProcessingOverlay moved to top level */}

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
          
          {/* New User Welcome Modal */}
          <NewUserWelcomeModal
            isOpen={showNewUserWelcome}
            onClose={() => setShowNewUserWelcome(false)}
            userName={newUserName}
          />
        </div>
      </div>
    </AppLayout>
  </>;
};
export default Index;