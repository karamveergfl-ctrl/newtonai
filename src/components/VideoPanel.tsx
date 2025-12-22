import { useState } from "react";
import { VideoCard } from "./VideoCard";
import { Button } from "@/components/ui/button";
import { Sparkles, X, BookOpen, Brain, Loader2, FileText, Network } from "lucide-react";
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
  onGenerateFlashcards?: (videoId: string, videoTitle: string) => void;
  onGenerateQuiz?: (videoId: string, videoTitle: string) => void;
  onGenerateSummary?: (videoId: string, videoTitle: string) => void;
  onGenerateMindMap?: (videoId: string, videoTitle: string) => void;
  isGenerating?: boolean;
  defaultTab?: "animation" | "explanation";
}

export const VideoPanel = ({ 
  animationVideos, 
  explanationVideos, 
  searchQuery, 
  onVideoClick, 
  onClose,
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateMindMap,
  isGenerating,
  defaultTab = "animation"
}: VideoPanelProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleGenerateAll = (type: 'flashcards' | 'quiz' | 'summary' | 'mindmap') => {
    const firstVideo = [...animationVideos, ...explanationVideos][0];
    if (!firstVideo) return;
    
    switch (type) {
      case 'flashcards':
        onGenerateFlashcards?.(firstVideo.videoId, firstVideo.title);
        break;
      case 'quiz':
        onGenerateQuiz?.(firstVideo.videoId, firstVideo.title);
        break;
      case 'summary':
        onGenerateSummary?.(firstVideo.videoId, firstVideo.title);
        break;
      case 'mindmap':
        onGenerateMindMap?.(firstVideo.videoId, firstVideo.title);
        break;
    }
  };

  const hasStudyTools = onGenerateFlashcards || onGenerateQuiz || onGenerateSummary || onGenerateMindMap;

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
          
          {hasStudyTools && (
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
                  <span className="hidden sm:inline">Study Tools</span>
                  <span className="sm:hidden">Study</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onGenerateQuiz && (
                  <DropdownMenuItem onClick={() => handleGenerateAll('quiz')} className="gap-2">
                    <Brain className="w-4 h-4" />
                    Generate Quiz
                  </DropdownMenuItem>
                )}
                {onGenerateFlashcards && (
                  <DropdownMenuItem onClick={() => handleGenerateAll('flashcards')} className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Generate Flashcards
                  </DropdownMenuItem>
                )}
                {onGenerateSummary && (
                  <DropdownMenuItem onClick={() => handleGenerateAll('summary')} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Generate Summary
                  </DropdownMenuItem>
                )}
                {onGenerateMindMap && (
                  <DropdownMenuItem onClick={() => handleGenerateAll('mindmap')} className="gap-2">
                    <Network className="w-4 h-4" />
                    Generate Mind Map
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
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "animation" | "explanation")} className="w-full">
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
                onGenerateSummary={onGenerateSummary}
                onGenerateMindMap={onGenerateMindMap}
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
                onGenerateSummary={onGenerateSummary}
                onGenerateMindMap={onGenerateMindMap}
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
