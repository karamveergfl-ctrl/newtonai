import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoCard } from "./VideoCard";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
}

interface TopicCardProps {
  topic: {
    heading: string;
    summary: string;
    videos: Video[];
  };
}

export const TopicCard = ({ topic }: TopicCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [videos, setVideos] = useState<Video[]>(topic.videos);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const findMoreVideos = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            query: topic.heading,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search videos");
      }

      const data = await response.json();
      setVideos((prev) => {
        const existingIds = new Set(prev.map(v => v.videoId));
        const newVideos = data.videos.filter((v: Video) => !existingIds.has(v.videoId));
        return [...prev, ...newVideos];
      });

      toast({
        title: "Found more videos!",
        description: `Added ${data.videos.length} new videos`,
      });
    } catch (error) {
      console.error("Error searching videos:", error);
      toast({
        title: "Error",
        description: "Failed to find more videos",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="cursor-pointer bg-gradient-to-r from-primary/10 to-secondary/10" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground">{topic.heading}</CardTitle>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-6 space-y-6 animate-fade-in">
          <p className="text-muted-foreground leading-relaxed">{topic.summary}</p>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Educational Videos</h3>
              <Button
                onClick={findMoreVideos}
                disabled={isSearching}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                {isSearching ? "Searching..." : "Find More"}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.videoId} video={video} />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
