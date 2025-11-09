import { useState } from "react";
import { VideoCard } from "./VideoCard";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

export const VideoPanel = ({ animationVideos, explanationVideos, searchQuery, onVideoClick, onClose }: VideoPanelProps) => {
  const [activeTab, setActiveTab] = useState("animation");

  return (
    <div className="relative h-full flex flex-col">
      {/* Sticky Header - Always visible on top left */}
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
        
        {/* Tabs for switching video types */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

      {/* Video Content - Scrollable */}
      <div className="flex-1 overflow-auto px-2 md:px-4 space-y-3 pb-4">
        {activeTab === "animation" ? (
          animationVideos.length > 0 ? (
            animationVideos.map((video) => (
              <VideoCard 
                key={video.videoId} 
                video={video}
                onVideoClick={onVideoClick}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No animation videos found</p>
          )
        ) : (
          explanationVideos.length > 0 ? (
            explanationVideos.map((video) => (
              <VideoCard 
                key={video.videoId} 
                video={video}
                onVideoClick={onVideoClick}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No explanation videos found</p>
          )
        )}
      </div>
    </div>
  );
};
