import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Brain, Loader2, FileText, Network, Clock, Eye, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoGenerationSettingsDialog, VideoGenerationSettings } from "./VideoGenerationSettingsDialog";
import { CreditBadge } from "./CreditBadge";
import { FEATURE_COSTS } from "@/lib/creditConfig";

interface VideoCardWithToolsProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    videoId: string;
    duration?: string;
    viewCount?: string;
  };
  onVideoClick: (videoId: string) => void;
  onGenerateFlashcards?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
  onGenerateQuiz?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
  onGenerateSummary?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
  onGenerateMindMap?: (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) => void;
  isGenerating?: boolean;
  activeGenerating?: "quiz" | "flashcards" | "summary" | "mindmap" | null;
  isLargeView?: boolean;
}

// Helper to format duration from ISO 8601 or seconds
const formatDuration = (duration?: string) => {
  if (!duration) return null;
  
  // If it's already formatted like "10:30", return as is
  if (/^\d+:\d+/.test(duration)) return duration;
  
  // Parse ISO 8601 duration (PT1H2M3S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return duration;
};

// Helper to format view count
const formatViewCount = (viewCount?: string) => {
  if (!viewCount) return null;
  
  const count = parseInt(viewCount);
  if (isNaN(count)) return viewCount;
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
};

export const VideoCardWithTools = ({ 
  video, 
  onVideoClick, 
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateMindMap,
  isGenerating,
  activeGenerating,
  isLargeView = false,
}: VideoCardWithToolsProps) => {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pendingToolType, setPendingToolType] = useState<"quiz" | "flashcards" | "summary" | "mindmap" | null>(null);
  
  const hasStudyTools = onGenerateFlashcards || onGenerateQuiz || onGenerateSummary || onGenerateMindMap;
  const formattedDuration = formatDuration(video.duration);
  const formattedViews = formatViewCount(video.viewCount);

  const handleToolClick = (toolType: "quiz" | "flashcards" | "summary" | "mindmap") => {
    setPendingToolType(toolType);
    setSettingsDialogOpen(true);
  };

  const handleGenerateWithSettings = (settings: VideoGenerationSettings) => {
    if (!pendingToolType) return;
    
    switch (pendingToolType) {
      case "quiz":
        onGenerateQuiz?.(video.videoId, video.title, settings);
        break;
      case "flashcards":
        onGenerateFlashcards?.(video.videoId, video.title, settings);
        break;
      case "summary":
        onGenerateSummary?.(video.videoId, video.title, settings);
        break;
      case "mindmap":
        onGenerateMindMap?.(video.videoId, video.title, settings);
        break;
    }
    setPendingToolType(null);
  };

  if (isLargeView) {
    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group w-full">
        {/* Large Video Thumbnail */}
        <div 
          className="relative aspect-video overflow-hidden bg-black cursor-pointer"
          onClick={() => onVideoClick(video.videoId)}
        >
          <img 
            src={video.thumbnail.replace('default', 'maxresdefault').replace('mqdefault', 'maxresdefault')} 
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to hqdefault if maxresdefault doesn't exist
              const target = e.target as HTMLImageElement;
              if (target.src.includes('maxresdefault')) {
                target.src = video.thumbnail.replace('default', 'hqdefault');
              }
            }}
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/90 group-hover:bg-primary group-hover:scale-110 flex items-center justify-center transition-all shadow-2xl">
              <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
          
          {/* Duration Badge */}
          {formattedDuration && (
            <div className="absolute bottom-3 left-3 bg-black/80 text-white text-sm px-2 py-1 rounded flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formattedDuration}
            </div>
          )}
          
          {/* Credit Badge */}
          <CreditBadge cost={FEATURE_COSTS.watch_video} className="absolute bottom-3 right-3" size="md" />

          {/* Settings Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white w-8 h-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}>
                Open in YouTube
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`https://youtube.com/watch?v=${video.videoId}`)}>
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h3 className="font-bold text-lg line-clamp-2 mb-2">
            {video.title}
          </h3>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{video.channelTitle}</p>
            {formattedViews && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formattedViews}
              </p>
            )}
          </div>

          {/* Study Tools Row */}
          {hasStudyTools && (
            <div className="flex items-center gap-2 pt-3 border-t">
              {onGenerateQuiz && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick("quiz");
                  }}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 gap-2",
                    activeGenerating === "quiz" && "bg-primary/10 border-primary"
                  )}
                  disabled={isGenerating}
                >
                  {activeGenerating === "quiz" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 text-primary" />
                  )}
                  Quiz
                </Button>
              )}
              
              {onGenerateFlashcards && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick("flashcards");
                  }}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 gap-2",
                    activeGenerating === "flashcards" && "bg-secondary/10 border-secondary"
                  )}
                  disabled={isGenerating}
                >
                  {activeGenerating === "flashcards" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-secondary" />
                  )}
                  Cards
                </Button>
              )}
              
              {onGenerateSummary && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick("summary");
                  }}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 gap-2",
                    activeGenerating === "summary" && "bg-accent/10 border-accent"
                  )}
                  disabled={isGenerating}
                >
                  {activeGenerating === "summary" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 text-accent-foreground" />
                  )}
                  Summary
                </Button>
              )}
              
              {onGenerateMindMap && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick("mindmap");
                  }}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 gap-2",
                    activeGenerating === "mindmap" && "bg-primary/10 border-primary"
                  )}
                  disabled={isGenerating}
                >
                  {activeGenerating === "mindmap" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Network className="w-4 h-4 text-primary" />
                  )}
                  Map
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Settings Dialog for Large View */}
        {pendingToolType && (
          <VideoGenerationSettingsDialog
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
            type={pendingToolType}
            videoTitle={video.title}
            onGenerate={handleGenerateWithSettings}
          />
        )}
      </Card>
    );
  }

  // Compact card view - styled like reference image
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group flex gap-3 p-3">
      {/* Video Thumbnail - Left side */}
      <div 
        className="relative w-40 min-w-[160px] aspect-video overflow-hidden bg-black cursor-pointer rounded-lg shrink-0"
        onClick={() => onVideoClick(video.videoId)}
      >
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
        
        {/* Duration Badge */}
        {formattedDuration && (
          <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedDuration}
          </div>
        )}
        
        {/* Credit Badge */}
        <CreditBadge cost={FEATURE_COSTS.watch_video} className="absolute bottom-1.5 right-1.5" />
      </div>

      {/* Video Info - Right side */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{video.channelTitle}</p>
          
          {/* Animated badge */}
          <span className="inline-block text-xs text-primary font-medium mt-1">Animated</span>
          
          {/* Views */}
          {formattedViews && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Eye className="w-3 h-3" />
              {formattedViews}
            </p>
          )}
        </div>

        {/* Study Tools Row at Bottom */}
        {hasStudyTools && (
          <div className="flex items-center gap-1.5 mt-2">
            {onGenerateQuiz && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolClick("quiz");
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg bg-muted/50 hover:bg-primary/20",
                  activeGenerating === "quiz" && "bg-primary/20"
                )}
                disabled={isGenerating}
                title="Generate Quiz"
              >
                {activeGenerating === "quiz" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 text-primary" />
                )}
              </Button>
            )}
            
            {onGenerateFlashcards && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolClick("flashcards");
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg bg-muted/50 hover:bg-secondary/20",
                  activeGenerating === "flashcards" && "bg-secondary/20"
                )}
                disabled={isGenerating}
                title="Generate Flashcards"
              >
                {activeGenerating === "flashcards" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BookOpen className="w-4 h-4 text-secondary" />
                )}
              </Button>
            )}
            
            {onGenerateSummary && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolClick("summary");
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg bg-muted/50 hover:bg-accent/20",
                  activeGenerating === "summary" && "bg-accent/20"
                )}
                disabled={isGenerating}
                title="Generate Summary"
              >
                {activeGenerating === "summary" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-orange-500" />
                )}
              </Button>
            )}
            
            {onGenerateMindMap && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolClick("mindmap");
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg bg-muted/50 hover:bg-primary/20",
                  activeGenerating === "mindmap" && "bg-primary/20"
                )}
                disabled={isGenerating}
                title="Generate Mind Map"
              >
                {activeGenerating === "mindmap" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Network className="w-4 h-4 text-red-500" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Settings Dialog for Compact View */}
      {pendingToolType && (
        <VideoGenerationSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          type={pendingToolType}
          videoTitle={video.title}
          onGenerate={handleGenerateWithSettings}
        />
      )}
    </Card>
  );
};
