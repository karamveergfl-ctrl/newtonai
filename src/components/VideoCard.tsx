import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Loader2 } from "lucide-react";
import { useState } from "react";

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
  isGeneratingFlashcards?: boolean;
}

export const VideoCard = ({ 
  video, 
  onVideoClick, 
  onGenerateFlashcards,
  isGeneratingFlashcards 
}: VideoCardProps) => {
  const [showFlashcardBtn, setShowFlashcardBtn] = useState(false);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
      onMouseEnter={() => setShowFlashcardBtn(true)}
      onMouseLeave={() => setShowFlashcardBtn(false)}
      onTouchStart={() => setShowFlashcardBtn(true)}
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
          {onGenerateFlashcards && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateFlashcards(video.title);
              }}
              variant="ghost"
              size="sm"
              className={`gap-1 h-7 text-xs shrink-0 transition-opacity ${
                showFlashcardBtn ? 'opacity-100' : 'opacity-0 sm:opacity-100'
              }`}
              disabled={isGeneratingFlashcards}
            >
              {isGeneratingFlashcards ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BookOpen className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Flashcards</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
