import { VideoCard } from "./VideoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
}

interface VideoPanelProps {
  videos: Video[];
  searchQuery: string;
  onVideoClick: (videoId: string) => void;
  onClose: () => void;
}

export const VideoPanel = ({ videos, searchQuery, onVideoClick, onClose }: VideoPanelProps) => {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Videos about: {searchQuery}
        </h2>
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
      <div className="space-y-4 pb-6">
        {videos.map((video) => (
          <VideoCard 
            key={video.videoId} 
            video={video}
            onVideoClick={onVideoClick}
          />
        ))}
      </div>
    </div>
  );
};
