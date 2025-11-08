import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PDFReader } from "@/components/PDFReader";
import { VideoPanel } from "@/components/VideoPanel";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SearchBox } from "@/components/SearchBox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
}

const Index = () => {
  const [pdfData, setPdfData] = useState<{ pdfUrl: string; pdfName: string } | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const handleUploadComplete = (data: { pdfUrl: string; pdfName: string }) => {
    setPdfData(data);
    setVideos([]);
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
      setVideos(data.videos);
      setSearchQuery(data.topic);
      
      toast({
        title: "Videos Found!",
        description: `Found ${data.videos.length} videos about "${data.topic}"`,
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
    setVideos([]);
    setSearchQuery("");
    setSelectedVideoId(null);
  };

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId(videoId);
  };

  const handleClosePlayer = () => {
    setSelectedVideoId(null);
  };

  if (!pdfData) {
    return <UploadZone onUploadComplete={handleUploadComplete} />;
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
            {isSearching && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Finding videos...</span>
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 flex overflow-hidden ${isFullscreen ? '' : 'divide-x'}`}>
          {/* Left Side - PDF Viewer */}
          <div className={`flex flex-col p-6 overflow-hidden animate-fade-in ${isFullscreen ? 'flex-1' : 'w-1/2'}`}>
            <SearchBox onSearch={handleSearch} isSearching={isSearching} />
            {selectedVideoId && (
              <VideoPlayer videoId={selectedVideoId} onClose={handleClosePlayer} />
            )}
            <div className="flex-1 overflow-auto">
              <PDFReader 
                pdfUrl={pdfData.pdfUrl} 
                onTextSelect={handleTextSelect}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            </div>
          </div>
          
          {/* Right Side - Video Panel */}
          {!isFullscreen && (
            <div className="w-1/2 bg-card/30 backdrop-blur-sm overflow-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="p-6">
                <VideoPanel 
                  videos={videos} 
                  searchQuery={searchQuery}
                  onVideoClick={handleVideoClick}
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
