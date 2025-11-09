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
    <div className="relative">
      {/* Sticky Header with Close Button */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b pb-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </Button>
        </div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          Videos about: {searchQuery}
        </h2>
        
        {/* Tabs for switching video types */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="animation">
              Animation Videos ({animationVideos.length})
            </TabsTrigger>
            <TabsTrigger value="explanation">
              Explanation Videos ({explanationVideos.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Video Content */}
      <div className="space-y-4 pb-6">
        {activeTab === "animation" ? (
          animationVideos.map((video) => (
            <VideoCard 
              key={video.videoId} 
              video={video}
              onVideoClick={onVideoClick}
            />
          ))
        ) : (
          explanationVideos.map((video) => (
            <VideoCard 
              key={video.videoId} 
              video={video}
              onVideoClick={onVideoClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
