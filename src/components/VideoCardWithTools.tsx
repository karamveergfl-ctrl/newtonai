import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Brain, Loader2, FileText, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardWithToolsProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    videoId: string;
  };
  onVideoClick: (videoId: string) => void;
  onGenerateFlashcards?: (videoId: string, videoTitle: string) => void;
  onGenerateQuiz?: (videoId: string, videoTitle: string) => void;
  onGenerateSummary?: (videoId: string, videoTitle: string) => void;
  onGenerateMindMap?: (videoId: string, videoTitle: string) => void;
  isGenerating?: boolean;
  activeGenerating?: "quiz" | "flashcards" | "summary" | "mindmap" | null;
}

export const VideoCardWithTools = ({ 
  video, 
  onVideoClick, 
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateMindMap,
  isGenerating,
  activeGenerating,
}: VideoCardWithToolsProps) => {
  const hasStudyTools = onGenerateFlashcards || onGenerateQuiz || onGenerateSummary || onGenerateMindMap;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Video Thumbnail */}
      <div 
        className="relative aspect-video overflow-hidden bg-black cursor-pointer"
        onClick={() => onVideoClick(video.videoId)}
      >
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center transition-all">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-3">
        <h3 className="font-semibold text-xs line-clamp-2 mb-1">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate mb-3">{video.channelTitle}</p>

        {/* Study Tools Row at Bottom */}
        {hasStudyTools && (
          <div className="flex items-center justify-between gap-1 pt-2 border-t">
            {onGenerateQuiz && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateQuiz(video.videoId, video.title);
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 h-7 gap-1 p-1",
                  activeGenerating === "quiz" && "bg-primary/10"
                )}
                disabled={isGenerating}
                title="Generate Quiz"
              >
                {activeGenerating === "quiz" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Brain className="w-3 h-3 text-primary" />
                )}
              </Button>
            )}
            
            {onGenerateFlashcards && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateFlashcards(video.videoId, video.title);
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 h-7 gap-1 p-1",
                  activeGenerating === "flashcards" && "bg-secondary/10"
                )}
                disabled={isGenerating}
                title="Generate Flashcards"
              >
                {activeGenerating === "flashcards" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BookOpen className="w-3 h-3 text-secondary" />
                )}
              </Button>
            )}
            
            {onGenerateSummary && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateSummary(video.videoId, video.title);
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 h-7 gap-1 p-1",
                  activeGenerating === "summary" && "bg-accent/10"
                )}
                disabled={isGenerating}
                title="Generate Summary"
              >
                {activeGenerating === "summary" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 text-accent" />
                )}
              </Button>
            )}
            
            {onGenerateMindMap && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateMindMap(video.videoId, video.title);
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 h-7 gap-1 p-1",
                  activeGenerating === "mindmap" && "bg-primary/10"
                )}
                disabled={isGenerating}
                title="Generate Mind Map"
              >
                {activeGenerating === "mindmap" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Network className="w-3 h-3 text-primary" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
