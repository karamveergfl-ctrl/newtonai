import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UploadZone } from "@/components/UploadZone";
import { PDFReader } from "@/components/PDFReader";
import { ImageViewer } from "@/components/ImageViewer";
import { VideoPanel } from "@/components/VideoPanel";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SearchBox } from "@/components/SearchBox";
import { SolutionPanel } from "@/components/SolutionPanel";
import { StudyTracker } from "@/components/StudyTracker";
import { PDFChat } from "@/components/PDFChat";
import { OCRSplitView } from "@/components/OCRSplitView";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, LogOut, FileText, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Session } from "@supabase/supabase-js";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  const [solutionData, setSolutionData] = useState<{ content: string; isQuestion: boolean } | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showOCRView, setShowOCRView] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [flashcards, setFlashcards] = useState<{ id: string; front: string; back: string }[]>([]);
  const [flashcardTitle, setFlashcardTitle] = useState("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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

  const handleUploadComplete = async (data: { pdfUrl: string; pdfName: string; isHandwritten?: boolean; ocrText?: string }) => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: session } = await supabase
          .from("study_sessions")
          .insert({ user_id: user.id, pdf_name: data.pdfName })
          .select()
          .single();
        setCurrentSessionId(session?.id || null);
      }
    } catch (error) {
      console.error("Error tracking session:", error);
    }
  };

  const handleSearch = async (query: string, imageData?: string) => {
    setIsSearching(true);
    try {
      // Get user's access token for authenticated API call
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ selectedText: query, imageData }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze text");
      }

      const data = await response.json();
      setAnimationVideos(data.animationVideos);
      setExplanationVideos(data.explanationVideos);
      setSearchQuery(data.topic);
      setShowVideosPanel(true);
      
      // Track search
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("search_history").insert({
            user_id: user.id,
            search_query: data.topic,
            is_question: data.isQuestion || false,
          });
        }
      } catch (error) {
        console.error("Error tracking search:", error);
      }
      
      // Set solution or description
      if (data.solution) {
        setSolutionData({ content: data.solution, isQuestion: true });
      } else if (data.description) {
        setSolutionData({ content: data.description, isQuestion: false });
      }
      
      toast({
        title: "Videos Found!",
        description: `Found ${data.animationVideos.length} animation and ${data.explanationVideos.length} explanation videos about "${data.topic}"`,
      });
    } catch (error) {
      console.error("Error analyzing text:", error);
      toast({
        title: "Error",
        description: "Failed to find videos",
        variant: "destructive",
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
      fetch(fileData.url)
        .then(res => res.blob())
        .then(blob => {
          const mimeType = fileData.isPdf ? 'application/pdf' : 'image/png';
          const file = new File([blob], fileData.name, { type: mimeType });
          setOcrFile(file);
          setShowOCRView(true);
        })
        .catch(error => {
          console.error("Error loading file for OCR:", error);
          toast({
            title: "Error",
            description: "Failed to load file for OCR processing",
            variant: "destructive",
          });
        });
    } else {
      // No file loaded, show file picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,application/pdf";
      input.onchange = (e) => {
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

  const handleGenerateFlashcards = async (videoTitle: string) => {
    setIsGeneratingFlashcards(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ 
            type: "video",
            videoTitle 
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const data = await response.json();
      setFlashcards(data.flashcards);
      setFlashcardTitle(data.title);
      
      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards for studying`,
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleGenerateFlashcardsFromContent = async () => {
    if (!pdfText && !fileData?.ocrText) {
      toast({
        title: "No content",
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingFlashcards(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }

      const content = pdfText || fileData?.ocrText || "";
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ 
            type: fileData?.isPdf ? "pdf" : "image",
            content: content.slice(0, 8000) // Limit content size
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const data = await response.json();
      setFlashcards(data.flashcards);
      setFlashcardTitle(fileData?.name || "Document Flashcards");
      
      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards for studying`,
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleCloseFlashcards = () => {
    setFlashcards([]);
    setFlashcardTitle("");
  };

  if (!session) {
    return null; // Auth redirect will happen in useEffect
  }

  if (!fileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SmartReader Pro
            </h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOCRUpload}
                variant="default"
                size="sm"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Rewrite Handwritten (A4)
              </Button>
              <ThemeToggle />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <SearchBox onSearch={handleSearch} isSearching={isSearching} />
          {showVideosPanel && (
            <div className="mt-8 animate-fade-in">
              <VideoPanel 
                animationVideos={animationVideos}
                explanationVideos={explanationVideos}
                searchQuery={searchQuery}
                onVideoClick={handleVideoClick}
                onClose={handleCloseVideosPanel}
                onGenerateFlashcards={handleGenerateFlashcards}
                isGeneratingFlashcards={isGeneratingFlashcards}
              />
            </div>
          )}
          <div className="mt-8 space-y-6">
            <StudyTracker />
            <UploadZone onUploadComplete={handleUploadComplete} />
          </div>
        </div>
        {selectedVideoId && (
          <VideoPlayer videoId={selectedVideoId} onClose={handleClosePlayer} />
        )}
        {showOCRView && ocrFile && (
          <OCRSplitView 
            file={ocrFile} 
            onClose={handleCloseOCR}
            onTextSelect={handleSearch}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="h-screen flex flex-col">
        {/* Compact Header */}
        <div className="p-2 md:p-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="gap-1 h-8 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">New File</span>
              </Button>
              <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                {fileData.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSearching && (
                <div className="hidden md:flex items-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Searching...</span>
                </div>
              )}
              <Button
                onClick={handleOCRUpload}
                variant="default"
                size="sm"
                className="gap-1 h-8"
              >
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline text-xs">Rewrite (A4)</span>
              </Button>
              <Button
                onClick={handleGenerateFlashcardsFromContent}
                variant="outline"
                size="sm"
                className="gap-1 h-8"
                disabled={isGeneratingFlashcards || (!pdfText && !fileData?.ocrText)}
              >
                {isGeneratingFlashcards ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                )}
                <span className="hidden sm:inline text-xs">Flashcards</span>
              </Button>
              <ThemeToggle />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="gap-1 h-8"
              >
                <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline text-xs">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Conditional rendering: Show PDF/Image or Search Results */}
          {!showVideosPanel && !solutionData ? (
            // File View with Search and Chat
            <div className="flex flex-col p-2 md:p-4 overflow-hidden animate-fade-in flex-1">
              <SearchBox onSearch={handleSearch} isSearching={isSearching} />
              <div className="flex-1 overflow-hidden">
                {fileData.isPdf ? (
                  <PDFReader 
                    pdfUrl={fileData.url} 
                    onTextSelect={handleTextSelect}
                    onImageCapture={handleImageCapture}
                    onPdfTextExtracted={setPdfText}
                  />
                ) : (
                  <ImageViewer
                    imageUrl={fileData.url}
                    imageName={fileData.name}
                    ocrText={fileData.ocrText}
                    onTextSelect={handleTextSelect}
                    onImageCapture={handleImageCapture}
                  />
                )}
              </div>
              {fileData.isPdf && <PDFChat pdfText={pdfText} pdfName={fileData.name} />}
            </div>
          ) : (
            // Search Results View: Videos and Solution side by side, no PDF
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden animate-fade-in">
              {/* Solution Panel - Takes half screen */}
              {solutionData && (
                <div className="h-1/2 md:h-full md:w-1/2">
                  <SolutionPanel
                    content={solutionData.content}
                    isQuestion={solutionData.isQuestion}
                    onClose={() => setSolutionData(null)}
                  />
                </div>
              )}
              
              {/* Video Panel - Takes half screen */}
              {showVideosPanel && (
                <div className={`bg-card/30 backdrop-blur-sm h-1/2 md:h-full ${solutionData ? 'md:w-1/2' : 'md:w-full'}`}>
                  <VideoPanel 
                    animationVideos={animationVideos}
                    explanationVideos={explanationVideos}
                    searchQuery={searchQuery}
                    onVideoClick={handleVideoClick}
                    onClose={handleCloseVideosPanel}
                    onGenerateFlashcards={handleGenerateFlashcards}
                    isGeneratingFlashcards={isGeneratingFlashcards}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Fullscreen Video Player */}
          {selectedVideoId && (
            <VideoPlayer videoId={selectedVideoId} onClose={handleClosePlayer} />
          )}
          
          {/* OCR Split View */}
          {showOCRView && ocrFile && (
            <OCRSplitView 
              file={ocrFile} 
              onClose={handleCloseOCR}
              onTextSelect={handleSearch}
            />
          )}
          
          {/* Flashcard Deck */}
          {flashcards.length > 0 && (
            <FlashcardDeck
              flashcards={flashcards}
              title={flashcardTitle}
              onClose={handleCloseFlashcards}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
