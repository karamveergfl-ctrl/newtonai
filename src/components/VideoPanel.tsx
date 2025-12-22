import { useState } from "react";
import { VideoCardWithTools } from "./VideoCardWithTools";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
}

interface VideoPanelProps {
  animationVideos: Video[];
  explanationVideos: Video[];
  searchQuery: string;
  onVideoClick: (videoId: string) => void;
  onClose: () => void;
  onGenerateFlashcards?: (videoId: string, videoTitle: string) => void;
  onGenerateQuiz?: (videoId: string, videoTitle: string) => void;
  onGenerateSummary?: (videoId: string, videoTitle: string) => void;
  onGenerateMindMap?: (videoId: string, videoTitle: string) => void;
  isGenerating?: boolean;
  activeGenerating?: "quiz" | "flashcards" | "summary" | "mindmap" | null;
  defaultTab?: "animation" | "explanation";
}

export const VideoPanel = ({ 
  animationVideos, 
  explanationVideos, 
  searchQuery, 
  onVideoClick, 
  onClose,
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateMindMap,
  isGenerating,
  activeGenerating,
  defaultTab = "animation"
}: VideoPanelProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="relative h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b pb-3 mb-3 px-2 md:px-4">
        <div className="flex items-center justify-between mb-3">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="gap-1 h-8"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        </div>
        <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
          <span className="line-clamp-1">{searchQuery}</span>
        </h2>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "animation" | "explanation")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="animation" className="text-xs md:text-sm">
              Animation ({animationVideos.length})
            </TabsTrigger>
            <TabsTrigger value="explanation" className="text-xs md:text-sm">
              Theory ({explanationVideos.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Video Content - Grid for better layout with study tools */}
      <div className="flex-1 overflow-auto px-2 md:px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeTab === "animation" ? (
            animationVideos.length > 0 ? (
              animationVideos.map((video) => (
                <VideoCardWithTools 
                  key={video.videoId} 
                  video={video}
                  onVideoClick={onVideoClick}
                  onGenerateFlashcards={onGenerateFlashcards}
                  onGenerateQuiz={onGenerateQuiz}
                  onGenerateSummary={onGenerateSummary}
                  onGenerateMindMap={onGenerateMindMap}
                  isGenerating={isGenerating}
                  activeGenerating={activeGenerating}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">No animation videos found</p>
            )
          ) : (
            explanationVideos.length > 0 ? (
              explanationVideos.map((video) => (
                <VideoCardWithTools 
                  key={video.videoId} 
                  video={video}
                  onVideoClick={onVideoClick}
                  onGenerateFlashcards={onGenerateFlashcards}
                  onGenerateQuiz={onGenerateQuiz}
                  onGenerateSummary={onGenerateSummary}
                  onGenerateMindMap={onGenerateMindMap}
                  isGenerating={isGenerating}
                  activeGenerating={activeGenerating}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">No explanation videos found</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};
