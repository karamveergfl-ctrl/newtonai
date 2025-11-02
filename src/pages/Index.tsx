import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PDFReader } from "@/components/PDFReader";
import { VideoPanel } from "@/components/VideoPanel";
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
  const { toast } = useToast();

  const handleUploadComplete = (data: { pdfUrl: string; pdfName: string }) => {
    setPdfData(data);
    setVideos([]);
    setSearchQuery("");
  };

  const handleTextSelect = async (selectedText: string) => {
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
          body: JSON.stringify({ selectedText }),
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

  const handleReset = () => {
    if (pdfData?.pdfUrl) {
      URL.revokeObjectURL(pdfData.pdfUrl);
    }
    setPdfData(null);
    setVideos([]);
    setSearchQuery("");
  };

  if (!pdfData) {
    return <UploadZone onUploadComplete={handleUploadComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              onClick={handleReset}
              variant="ghost"
              className="mb-2 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Upload Another PDF
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {pdfData.pdfName}
            </h1>
          </div>
          {isSearching && (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Finding videos...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-in">
            <PDFReader 
              pdfUrl={pdfData.pdfUrl} 
              onTextSelect={handleTextSelect}
            />
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <VideoPanel videos={videos} searchQuery={searchQuery} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
