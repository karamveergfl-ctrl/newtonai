import { Button } from "@/components/ui/button";
import { X, Copy, Check, Loader2, Video, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoResult {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface SolutionPanelProps {
  content: string;
  isQuestion?: boolean;
  onClose: () => void;
  isLoading?: boolean;
  screenshotImage?: string;
  searchTopic?: string;
}

export const SolutionPanel = ({ 
  content, 
  isQuestion = true, 
  onClose,
  isLoading = false,
  screenshotImage,
  searchTopic
}: SolutionPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const { toast } = useToast();

  // Search for related videos when searchTopic changes
  useEffect(() => {
    if (searchTopic && !isLoading) {
      searchVideos(searchTopic);
    }
  }, [searchTopic, isLoading]);

  const searchVideos = async (topic: string) => {
    setIsLoadingVideos(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-youtube', {
        body: { query: topic }
      });

      if (error) {
        console.error("Error searching videos:", error);
        return;
      }

      if (data?.videos) {
        setVideos(data.videos.slice(0, 3)); // Show top 3 videos
      }
    } catch (err) {
      console.error("Failed to search videos:", err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Solution copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const openVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  // Format markdown-style content to HTML
  const formatContent = (text: string) => {
    return text
      // Headers
      .replace(/#### (.*?)(\n|$)/g, '<h4 class="text-base font-bold mt-4 mb-2 text-primary">$1</h4>')
      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-bold mt-4 mb-2 text-primary">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-xl font-bold mt-4 mb-2 text-primary">$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1 class="text-2xl font-bold mt-4 mb-2 text-primary">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto text-sm"><code>$2</code></pre>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto text-sm"><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      // Bullet points
      .replace(/^[\-\*] (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br/>')
      // Wrap in paragraph
      .replace(/^(?!<[h|u|l|p|c|o])(.*?)$/gm, '<p class="mb-2">$1</p>');
  };

  return (
    <div className="h-full flex flex-col bg-card border-l animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Analyzing...
            </>
          ) : (
            <>
              {isQuestion ? "📝 Solution" : "💡 Analysis"}
            </>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {!isLoading && content && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {/* Screenshot preview */}
          {screenshotImage && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Captured area:</p>
              <img 
                src={screenshotImage} 
                alt="Captured screenshot" 
                className="max-w-full h-auto rounded-lg border border-border shadow-sm max-h-48 object-contain"
              />
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 text-muted-foreground">
                Analyzing with AI...
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                This may take a few seconds
              </p>
            </div>
          )}

          {/* Solution content */}
          {!isLoading && content && (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: formatContent(content) }} 
            />
          )}

          {/* Related Videos Section */}
          {!isLoading && content && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Related Video Solutions</h4>
              </div>

              {isLoadingVideos ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Finding videos...</span>
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => openVideo(video.videoId)}
                      className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                    >
                      <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {video.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {video.channelTitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTopic ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No related videos found
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Videos will appear here after analysis
                </p>
              )}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !content && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No solution available</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};