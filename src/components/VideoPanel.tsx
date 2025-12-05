import { useState } from "react";
import { VideoCard } from "./VideoCard";
import { Button } from "@/components/ui/button";
import { Sparkles, X, BookOpen, Brain, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
}

interface VideoPanelProps {
  animationVideos: Video[];
  explanationVideos: Video[];
  searchQuery: string;
  onVideoClick: (videoId: string) => void;
  onClose: () => void;
  onGenerateFlashcards?: (videoTitle: string) => void;
  onGenerateQuiz?: (videoTitle: string) => void;
  isGenerating?: boolean;
}

export const VideoPanel = ({ 
  animationVideos, 
  explanationVideos, 
  searchQuery, 
  onVideoClick, 
  onClose,
  onGenerateFlashcards,
  onGenerateQuiz,
  isGenerating
}: VideoPanelProps) => {
  const [activeTab, setActiveTab] = useState("animation");

  const handleGenerateAll = (type: 'flashcards' | 'quiz') => {
    const allTitles = [...animationVideos, ...explanationVideos]
      .slice(0, 5)
      .map(v => v.title)
      .join(", ");
    
    if (type === 'flashcards' && onGenerateFlashcards) {
      onGenerateFlashcards(allTitles);
    } else if (type === 'quiz' && onGenerateQuiz) {
      onGenerateQuiz(allTitles);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b pb-3 mb-3 px-2 md:px-4">
        <div className="flex items-center justify-between mb-3">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="gap-1 h-8"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </Button>
          
          {(onGenerateFlashcards || onGenerateQuiz) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 h-8 bg-gradient-to-r from-primary to-secondary"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Study All</span>
                  <span className="sm:hidden">Study</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onGenerateFlashcards && (
                  <DropdownMenuItem onClick={() => handleGenerateAll('flashcards')} className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Generate Flashcards
                  </DropdownMenuItem>
                )}
                {onGenerateQuiz && (
                  <DropdownMenuItem onClick={() => handleGenerateAll('quiz')} className="gap-2">
                    <Brain className="w-4 h-4" />
                    Take a Quiz
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
          <span className="line-clamp-1">{searchQuery}</span>
        </h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="animation" className="text-xs md:text-sm">
              Animation ({animationVideos.length})
            </TabsTrigger>
            <TabsTrigger value="explanation" className="text-xs md:text-sm">
              Theory ({explanationVideos.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Video Content */}
      <div className="flex-1 overflow-auto px-2 md:px-4 space-y-3 pb-4">
        {activeTab === "animation" ? (
          animationVideos.length > 0 ? (
            animationVideos.map((video) => (
              <VideoCard 
                key={video.videoId} 
                video={video}
                onVideoClick={onVideoClick}
                onGenerateFlashcards={onGenerateFlashcards}
                onGenerateQuiz={onGenerateQuiz}
                isGenerating={isGenerating}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No animation videos found</p>
          )
        ) : (
          explanationVideos.length > 0 ? (
            explanationVideos.map((video) => (
              <VideoCard 
                key={video.videoId} 
                video={video}
                onVideoClick={onVideoClick}
                onGenerateFlashcards={onGenerateFlashcards}
                onGenerateQuiz={onGenerateQuiz}
                isGenerating={isGenerating}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No explanation videos found</p>
          )
        )}
      </div>
    </div>
  );
};
