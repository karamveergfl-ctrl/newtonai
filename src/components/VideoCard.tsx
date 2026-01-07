import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Brain, Loader2, FileText, Network } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditBadge } from "@/components/CreditBadge";
import { FEATURE_COSTS } from "@/lib/creditConfig";
interface VideoCardProps {
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
}

export const VideoCard = ({ 
  video, 
  onVideoClick, 
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateMindMap,
  isGenerating 
}: VideoCardProps) => {
  const [showStudyBtn, setShowStudyBtn] = useState(false);

  const hasStudyTools = onGenerateFlashcards || onGenerateQuiz || onGenerateSummary || onGenerateMindMap;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
      onMouseEnter={() => setShowStudyBtn(true)}
      onMouseLeave={() => setShowStudyBtn(false)}
      onTouchStart={() => setShowStudyBtn(true)}
    >
      <div 
        className="relative aspect-video overflow-hidden bg-black"
        onClick={() => onVideoClick(video.videoId)}
      >
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center transition-all">
            <Play className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
        {/* Credit cost badge */}
        <CreditBadge cost={FEATURE_COSTS.watch_video} className="absolute bottom-2 right-2" />
      </div>
      <div className="p-3 md:p-4">
        <h3 className="font-semibold text-xs md:text-sm line-clamp-2 mb-2">
          {video.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate flex-1">{video.channelTitle}</p>
          {hasStudyTools && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  onClick={(e) => e.stopPropagation()}
                  variant="ghost"
                  size="sm"
                  className={`gap-1 h-7 text-xs shrink-0 transition-opacity ${
                    showStudyBtn ? 'opacity-100' : 'opacity-0 sm:opacity-100'
                  }`}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Brain className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Study</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onGenerateQuiz && (
                  <DropdownMenuItem 
                    onClick={() => onGenerateQuiz(video.videoId, video.title)} 
                    className="gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    Generate Quiz
                  </DropdownMenuItem>
                )}
                {onGenerateFlashcards && (
                  <DropdownMenuItem 
                    onClick={() => onGenerateFlashcards(video.videoId, video.title)} 
                    className="gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Generate Flashcards
                  </DropdownMenuItem>
                )}
                {onGenerateSummary && (
                  <DropdownMenuItem 
                    onClick={() => onGenerateSummary(video.videoId, video.title)} 
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Summary
                  </DropdownMenuItem>
                )}
                {onGenerateMindMap && (
                  <DropdownMenuItem 
                    onClick={() => onGenerateMindMap(video.videoId, video.title)} 
                    className="gap-2"
                  >
                    <Network className="w-4 h-4" />
                    Generate Mind Map
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
};
