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
      <Card className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Sparkles className="w-16 h-16 text-primary/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">
            Select Text to Discover Videos
          </h3>
          <p className="text-muted-foreground max-w-md">
            Highlight any topic or concept in your PDF, and we'll instantly find the best educational animation videos to help you understand it better.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Videos about: {searchQuery}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.videoId} video={video} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
