import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    videoId: string;
  };
  onVideoClick: (videoId: string) => void;
}

export const VideoCard = ({ video, onVideoClick }: VideoCardProps) => {
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => onVideoClick(video.videoId)}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center transition-all">
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
      </div>
    </Card>
  );
};
