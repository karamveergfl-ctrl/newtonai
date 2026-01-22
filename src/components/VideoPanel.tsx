import { useState, useEffect, useRef, useCallback } from "react";
import { VideoCardWithTools } from "./VideoCardWithTools";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoGenerationSettings } from "./VideoGenerationSettingsDialog";

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
  onGenerateFlashcards?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
  onGenerateQuiz?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
  onGenerateSummary?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
  onGenerateMindMap?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
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
  const loaderRef = useRef<HTMLDivElement>(null);

  const currentVideos = activeTab === "animation" ? animationVideos : explanationVideos;
  const hasMore = activeTab === "animation" ? hasMoreAnimation : hasMoreExplanation;

  const handleTabChange = (value: string) => {
    setActiveTab(value as "animation" | "explanation");
  };

  const handleLoadMore = useCallback(async () => {
    if (onLoadMore && !isLoadingMore && hasMore) {
      await onLoadMore(activeTab);
    }
  }, [onLoadMore, isLoadingMore, hasMore, activeTab]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && hasMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loader);

    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, isLoadingMore, hasMore, onLoadMore]);

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
              Explanation ({explanationVideos.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Video Content */}
      <div className="flex-1 overflow-auto px-2 md:px-4 pb-4">
        <p className="text-xs text-muted-foreground mb-3">
          {activeTab === "animation" 
            ? "High-quality animated explanations with visual learning" 
            : "In-depth explanations, lectures and tutorials"}
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
              
              {/* Infinite Scroll Loader */}
              {onLoadMore && hasMore && (
                <div ref={loaderRef} className="py-6 flex justify-center">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading more videos...</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* End of results message */}
              {!hasMore && currentVideos.length > 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No more {activeTab === "animation" ? "animation" : "explanation"} videos
                </p>
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
