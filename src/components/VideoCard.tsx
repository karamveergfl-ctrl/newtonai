import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Brain, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    videoId: string;
  };
  onVideoClick: (videoId: string) => void;
  onGenerateFlashcards?: (videoTitle: string) => void;
  onGenerateQuiz?: (videoTitle: string) => void;
  isGenerating?: boolean;
}

export const VideoCard = ({ 
  video, 
  onVideoClick, 
  onGenerateFlashcards,
  onGenerateQuiz,
  isGenerating 
}: VideoCardProps) => {
  const [showStudyBtn, setShowStudyBtn] = useState(false);

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
      </div>
      <div className="p-3 md:p-4">
        <h3 className="font-semibold text-xs md:text-sm line-clamp-2 mb-2">
          {video.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate flex-1">{video.channelTitle}</p>
          {(onGenerateFlashcards || onGenerateQuiz) && (
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
                {onGenerateFlashcards && (
                  <DropdownMenuItem onClick={() => onGenerateFlashcards(video.title)} className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Flashcards
                  </DropdownMenuItem>
                )}
                {onGenerateQuiz && (
                  <DropdownMenuItem onClick={() => onGenerateQuiz(video.title)} className="gap-2">
                    <Brain className="w-4 h-4" />
                    Quiz
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
