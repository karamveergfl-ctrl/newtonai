import { VideoCard } from "./VideoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

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
}

export const VideoPanel = ({ videos, searchQuery }: VideoPanelProps) => {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Sparkles className="w-16 h-16 text-primary/30 mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          Search or Select Text
        </h3>
        <p className="text-muted-foreground max-w-md">
          Use the search box to find topics, or highlight any text in the PDF. We'll instantly find the best educational animation videos to help you understand it better.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Videos about: {searchQuery}
        </h2>
      </div>
      <div className="space-y-4 pb-6">
        {videos.map((video) => (
          <VideoCard key={video.videoId} video={video} />
        ))}
      </div>
    </div>
  );
};
