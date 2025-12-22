import { useState } from "react";
import { VideoCardWithTools } from "./VideoCardWithTools";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ChevronLeft, ChevronRight, Grid, LayoutList } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentVideos = activeTab === "animation" ? animationVideos : explanationVideos;
  const currentVideo = currentVideos[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : currentVideos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < currentVideos.length - 1 ? prev + 1 : 0));
  };

  // Reset index when changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as "animation" | "explanation");
    setCurrentIndex(0);
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
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "single" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("single")}
              title="Single Video View"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
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
        {viewMode === "single" ? (
          // Single Video View
          <div className="flex flex-col items-center gap-4">
            {currentVideos.length > 0 && currentVideo ? (
              <>
                {/* Navigation Controls */}
                <div className="flex items-center justify-between w-full max-w-2xl">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={currentVideos.length <= 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {currentVideos.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={currentVideos.length <= 1}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Large Video Card */}
                <div className="w-full max-w-2xl">
                  <VideoCardWithTools 
                    video={currentVideo}
                    onVideoClick={onVideoClick}
                    onGenerateFlashcards={onGenerateFlashcards}
                    onGenerateQuiz={onGenerateQuiz}
                    onGenerateSummary={onGenerateSummary}
                    onGenerateMindMap={onGenerateMindMap}
                    isGenerating={isGenerating}
                    activeGenerating={activeGenerating}
                    isLargeView={true}
                  />
                </div>

                {/* Thumbnail Navigator */}
                <div className="flex gap-2 overflow-x-auto pb-2 w-full max-w-2xl">
                  {currentVideos.map((video, index) => (
                    <button
                      key={video.videoId}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentIndex 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                    >
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {index === currentIndex && (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No {activeTab === "animation" ? "animation" : "explanation"} videos found
              </p>
            )}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentVideos.length > 0 ? (
              currentVideos.map((video) => (
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
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">
                No {activeTab === "animation" ? "animation" : "explanation"} videos found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
