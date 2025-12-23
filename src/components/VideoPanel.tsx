import { useState } from "react";
import { VideoCardWithTools } from "./VideoCardWithTools";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
  duration?: string;
  viewCount?: string;
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
  onLoadMore?: (type: "animation" | "explanation") => Promise<void>;
  isLoadingMore?: boolean;
  hasMoreAnimation?: boolean;
  hasMoreExplanation?: boolean;
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
  defaultTab = "animation",
  onLoadMore,
  isLoadingMore,
  hasMoreAnimation = true,
  hasMoreExplanation = true,
}: VideoPanelProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const currentVideos = activeTab === "animation" ? animationVideos : explanationVideos;
  const hasMore = activeTab === "animation" ? hasMoreAnimation : hasMoreExplanation;

  const handleTabChange = (value: string) => {
    setActiveTab(value as "animation" | "explanation");
  };

  const handleLoadMore = async () => {
    if (onLoadMore && !isLoadingMore) {
      await onLoadMore(activeTab);
    }
  };

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
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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

      {/* Video Content */}
      <div className="flex-1 overflow-auto px-2 md:px-4 pb-4">
        <p className="text-xs text-muted-foreground mb-3">
          {activeTab === "animation" 
            ? "High-quality animated explanations with visual learning" 
            : "In-depth theoretical explanations and lectures"}
        </p>
        
        <div className="space-y-3">
          {currentVideos.length > 0 ? (
            <>
              {currentVideos.map((video) => (
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
              ))}
              
              {/* Load More Button */}
              {onLoadMore && hasMore && (
                <div className="pt-4 pb-2">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading more videos...
                      </>
                    ) : (
                      <>
                        Load More {activeTab === "animation" ? "Animations" : "Explanations"}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No {activeTab === "animation" ? "animation" : "explanation"} videos found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
