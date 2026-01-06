import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UploadZone } from "@/components/UploadZone";
import { LectureRecorder } from "@/components/LectureRecorder";
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
import { GamificationBadge } from "@/components/GamificationBadge";
import { AppLayout } from "@/components/AppLayout";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ArrowLeft, Loader2, LogOut, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Session } from "@supabase/supabase-js";
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

  // Lecture notes state
  const [lectureNotes, setLectureNotes] = useState("");
  const [lectureNotesTitle, setLectureNotesTitle] = useState("");
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
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
        navigate("/auth");
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

      // Fetch transcript first
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
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
      setFlashcards(data.flashcards);
      setFlashcardTitle(videoTitle);
      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards from video`
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFlashcards(false);
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
      setFlashcards(data.flashcards);
      setFlashcardTitle(fileData?.name || "Document Flashcards");
      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards for studying`
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };
  const handleCloseFlashcards = () => {
    setFlashcards([]);
    setFlashcardTitle("");
  };
  const handleGenerateQuizFromVideo = async (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => {
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

      // Fetch transcript first
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
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
      setQuizQuestions(data.questions);
      setQuizTitle(videoTitle);
      toast({
        title: "Quiz Ready! 🧠",
        description: `Generated ${data.questions.length} questions from video`
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };
  const handleGenerateSummaryFromVideo = async (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => {
    // Instantly show the screen with loading state
    setVideoStudyToolTitle(videoTitle);
    setShowVideoSummaryScreen(true);
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

      // Fetch transcript first
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: transcript.slice(0, 10000),
          detailLevel: settings?.detailLevel
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const data = await response.json();
      setVideoSummary(data.summary);
      toast({
        title: "Summary Ready! 📝",
        description: "Video summary generated successfully"
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      setShowVideoSummaryScreen(false);
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  const handleGenerateMindMapFromVideo = async (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => {
    // Instantly show the screen with loading state
    setVideoStudyToolTitle(videoTitle);
    setShowVideoMindMapScreen(true);
    setIsGeneratingMindMap(true);
    setActiveGenerating("mindmap");
    try {
      const {
        data: {
          session: authSession
        }
      } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      // Fetch transcript first
      const transcript = await fetchVideoTranscript(videoId, videoTitle);
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
      setVideoMindMap(data.mindMap);

      // Set the parsed mind map data for visual rendering
      if (data.mindMapData) {
        setVideoMindMapData(data.mindMapData);
      }
      setFullScreenMindMapTitle(videoTitle);
      toast({
        title: "Mind Map Ready! 🧠",
        description: "Video mind map generated successfully"
      });
    } catch (error) {
      console.error("Error generating mind map:", error);
      setShowVideoMindMapScreen(false);
      toast({
        title: "Error",
        description: "Failed to generate mind map",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMindMap(false);
      setActiveGenerating(null);
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
      setQuizQuestions(data.questions);
      setQuizTitle(fileData?.name || "Document Quiz");
      toast({
        title: "Quiz Ready! 🧠",
        description: `Generated ${data.questions.length} questions for testing`
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };
  const handleCloseQuiz = () => {
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
      setSummary(data.summary);
      toast({
        title: "Summary Ready! 📝",
        description: "Document summary generated successfully"
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSummary(false);
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
      setMindMap(data.mindMap);
      if (data.mindMapData) {
        setMindMapData(data.mindMapData);
      }
      toast({
        title: "Mind Map Ready! 🧠",
        description: "Visual mind map generated successfully"
      });
    } catch (error) {
      console.error("Error generating mind map:", error);
      toast({
        title: "Error",
        description: "Failed to generate mind map",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  // Generate study tools from selected text
  const handleGenerateQuizFromText = async (selectedText: string) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate a quiz",
        variant: "destructive"
      });
      return;
    }
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: "text",
          content: selectedText,
          title: "Selected Text Quiz"
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }
      const data = await response.json();
      setQuizQuestions(data.questions);
      setQuizTitle("Quiz from Selected Text");
      toast({
        title: "Quiz Ready! 🧠",
        description: `Generated ${data.questions.length} questions from selected text`
      });
    } catch (error) {
      console.error("Error generating quiz from text:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };
  const handleGenerateFlashcardsFromText = async (selectedText: string) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate flashcards",
        variant: "destructive"
      });
      return;
    }
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          type: "text",
          content: selectedText,
          title: "Selected Text"
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }
      const data = await response.json();
      setFlashcards(data.flashcards);
      setFlashcardTitle("Flashcards from Selected Text");
      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards from selected text`
      });
    } catch (error) {
      console.error("Error generating flashcards from text:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };
  const handleGenerateSummaryFromText = async (selectedText: string) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate a summary",
        variant: "destructive"
      });
      return;
    }
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: selectedText
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const data = await response.json();
      setSummary(data.summary);
      toast({
        title: "Summary Ready! 📝",
        description: "Summary generated from selected text"
      });
    } catch (error) {
      console.error("Error generating summary from text:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  const handleGenerateMindMapFromText = async (selectedText: string) => {
    if (!selectedText || selectedText.length < 20) {
      toast({
        title: "Text too short",
        description: "Please select more text to generate a mind map",
        variant: "destructive"
      });
      return;
    }
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          content: selectedText
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate mind map");
      }
      const data = await response.json();
      setMindMap(data.mindMap);
      if (data.mindMapData) {
        setMindMapData(data.mindMapData);
      }
      toast({
        title: "Mind Map Ready! 🧠",
        description: "Mind map generated from selected text"
      });
    } catch (error) {
      console.error("Error generating mind map from text:", error);
      toast({
        title: "Error",
        description: "Failed to generate mind map",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMindMap(false);
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
    return <AppLayout onToolSelect={handleSidebarToolSelect} onSignOut={handleSignOut}>
        <div className="flex-1 bg-gradient-to-br from-background via-background to-primary/5 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <GamificationBadge />
              <Button onClick={handleOCRUpload} variant="default" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                Rewrite Handwritten (A4)
              </Button>
            </div>
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
        </div>
      </AppLayout>;
  }
  return <AppLayout onToolSelect={handleSidebarToolSelect} onSignOut={handleSignOut}>
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
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
            <div className="flex items-center gap-2 shrink-0">
              {isSearching && <div className="hidden md:flex items-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Searching...</span>
                </div>}
              <GamificationBadge />
              <Button onClick={handleOCRUpload} variant="default" size="sm" className="gap-1 h-8">
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline text-xs">Rewrite (A4)</span>
              </Button>
              <StudyModeSelector onGenerateFlashcards={handleGenerateFlashcardsFromContent} onGenerateQuiz={handleGenerateQuizFromContent} isGenerating={isGeneratingFlashcards || isGeneratingQuiz} disabled={!pdfText && !fileData?.ocrText} />
            </div>
          </div>
        </div>

        {/* Study Tools Bar - Compact Row */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-card/80 to-card/40 border-b backdrop-blur-sm w-fit rounded-b-lg shadow-sm">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full">
            <span className="text-sm font-bold text-primary uppercase tracking-wide">Tools</span>
          </div>
          <StudyToolsBar onGenerateQuiz={handleGenerateQuizFromContent} onGenerateFlashcards={handleGenerateFlashcardsFromContent} onGenerateSummary={handleGenerateSummary} onGenerateMindMap={handleGenerateMindMap} onScreenshot={() => setTriggerScreenshot(true)} isGeneratingQuiz={isGeneratingQuiz} isGeneratingFlashcards={isGeneratingFlashcards} isGeneratingSummary={isGeneratingSummary} isGeneratingMindMap={isGeneratingMindMap} disabled={!pdfText && !fileData?.ocrText} totalPages={pdfPageCount} className="border-0 p-0 bg-transparent" />
          <div className="h-4 w-px bg-border/50" />
          <SearchBox onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Conditional rendering: Show PDF/Image or Search Results */}
          {!showVideosPanel && !solutionData ?
        // File View with Search and Chat
        <div className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden animate-fade-in">
              <div className="flex-1 overflow-hidden">
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
          {flashcards.length > 0 && <FlashcardDeck flashcards={flashcards} title={flashcardTitle} onClose={handleCloseFlashcards} />}
          
          {/* Quiz Mode */}
          {quizQuestions.length > 0 && <QuizMode questions={quizQuestions} title={quizTitle} onClose={handleCloseQuiz} onComplete={handleQuizComplete} />}

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
        </div>
      </div>
    </AppLayout>;
};
export default Index;