import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UploadZone } from "@/components/UploadZone";
import { PDFReader } from "@/components/PDFReader";
import { VideoPanel } from "@/components/VideoPanel";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SearchBox } from "@/components/SearchBox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
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
  const [pdfData, setPdfData] = useState<{ pdfUrl: string; pdfName: string } | null>(null);
  const [animationVideos, setAnimationVideos] = useState<Video[]>([]);
  const [explanationVideos, setExplanationVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
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

  const handleUploadComplete = (data: { pdfUrl: string; pdfName: string }) => {
    setPdfData(data);
    setAnimationVideos([]);
    setExplanationVideos([]);
    setSearchQuery("");
    setSelectedVideoId(null);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ selectedText: query }),
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

  const handleReset = () => {
    if (pdfData?.pdfUrl) {
      URL.revokeObjectURL(pdfData.pdfUrl);
    }
    setPdfData(null);
    setAnimationVideos([]);
    setExplanationVideos([]);
    setSearchQuery("");
    setSelectedVideoId(null);
    setShowVideosPanel(false);
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

  if (!session) {
    return null; // Auth redirect will happen in useEffect
  }

  if (!pdfData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SmartReader Pro
            </h1>
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
              />
            </div>
          )}
          <div className="mt-8">
            <UploadZone onUploadComplete={handleUploadComplete} />
          </div>
        </div>
        {selectedVideoId && (
          <VideoPlayer videoId={selectedVideoId} onClose={handleClosePlayer} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Upload Another
              </Button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {pdfData.pdfName}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {isSearching && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Finding videos...</span>
                </div>
              )}
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

        <div className={`flex-1 flex overflow-hidden ${showVideosPanel ? 'divide-x' : ''}`}>
          {/* Left Side - PDF Viewer */}
          <div className={`flex flex-col p-6 overflow-hidden animate-fade-in ${showVideosPanel ? 'w-1/2' : 'flex-1'}`}>
            <SearchBox onSearch={handleSearch} isSearching={isSearching} />
            <div className="flex-1 overflow-auto">
              <PDFReader 
                pdfUrl={pdfData.pdfUrl} 
                onTextSelect={handleTextSelect}
              />
            </div>
          </div>
          
          {/* Fullscreen Video Player */}
          {selectedVideoId && (
            <VideoPlayer videoId={selectedVideoId} onClose={handleClosePlayer} />
          )}
          
          {/* Right Side - Video Panel */}
          {showVideosPanel && (
            <div className="w-1/2 bg-card/30 backdrop-blur-sm overflow-auto animate-fade-in relative" style={{ animationDelay: "100ms" }}>
              <div className="p-6">
                <VideoPanel 
                  animationVideos={animationVideos}
                  explanationVideos={explanationVideos}
                  searchQuery={searchQuery}
                  onVideoClick={handleVideoClick}
                  onClose={handleCloseVideosPanel}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
