import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink, Play, X } from "lucide-react";
import { useReportFlashcards } from "@/hooks/useReportFlashcards";
import type { KnowledgeGap, RevisionFlashcard, ReportVideoResult } from "@/types/liveSession";

interface KnowledgeGapCardProps {
  gap: KnowledgeGap;
  flashcards: RevisionFlashcard[];
  videoResult: ReportVideoResult | null;
  isExpanded: boolean;
  onToggle: () => void;
}

const severityConfig = {
  high: { label: "HIGH", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  medium: { label: "MEDIUM", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  low: { label: "LOW", className: "bg-muted text-muted-foreground border-border" },
};

function FlashcardPractice({ flashcards }: { flashcards: RevisionFlashcard[] }) {
  const { currentCard, currentIndex, isFlipped, flip, next, sessionComplete, progress, cardId, markComplete } =
    useReportFlashcards({ flashcards });

  if (sessionComplete) {
    return (
      <div className="text-center py-3">
        <p className="text-sm text-emerald-500">Practice Complete ✓</p>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{currentIndex + 1}/{flashcards.length} cards</span>
        <span>{Math.round(progress)}% done</span>
      </div>
      <button
        onClick={() => {
          if (!isFlipped) {
            flip();
          } else {
            markComplete(cardId(currentCard, currentIndex));
            next();
          }
        }}
        className="w-full rounded-xl border border-border/50 bg-muted/20 p-5 text-center min-h-[120px] flex items-center justify-center transition-all hover:border-primary/50 cursor-pointer"
      >
        <div>
          <p className="text-xs">{isFlipped ? currentCard.back : currentCard.front}</p>
          {!isFlipped && <p className="text-[9px] text-muted-foreground mt-1">Tap to reveal</p>}
          {isFlipped && <p className="text-[9px] text-primary mt-1">Tap for next →</p>}
        </div>
      </button>
    </div>
  );
}

export function KnowledgeGapCard({ gap, flashcards, videoResult, isExpanded, onToggle }: KnowledgeGapCardProps) {
  const config = severityConfig[gap.severity];
  const [inlineVideo, setInlineVideo] = useState(false);
  const resourceHints: string[] = [];
  if (flashcards.length > 0) resourceHints.push(`${flashcards.length} flashcards`);
  if (videoResult) resourceHints.push("Video available");

  return (
    <Card className={cn("border-border/50", 
      gap.severity === "high" && "border-red-800 bg-red-950/10",
      gap.severity === "medium" && "border-amber-800 bg-amber-950/10"
    )}>
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-2.5 text-left">
        <Badge variant="outline" className={`text-[9px] shrink-0 ${config.className}`}>
          {config.label}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{gap.topic}</p>
          <p className="text-[11px] text-muted-foreground">{gap.gap_reason}</p>
          {resourceHints.length > 0 && (
            <p className="text-[10px] text-primary/70 mt-0.5">{resourceHints.join(" · ")}</p>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Flashcards */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Revision Flashcards</p>
              {flashcards.length > 0 ? (
                <FlashcardPractice flashcards={flashcards} />
              ) : (
                <p className="text-[10px] text-muted-foreground">No flashcards for this topic</p>
              )}
            </div>

            {/* Video */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Video Resource</p>
              {videoResult ? (
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  {/* Inline player */}
                  {inlineVideo ? (
                    <div className="relative">
                      <div className="aspect-video bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoResult.video_id}?autoplay=1&rel=0`}
                          className="w-full h-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-black/60 text-white hover:bg-black/80"
                        onClick={() => setInlineVideo(false)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInlineVideo(true)}
                      className="relative w-full group"
                    >
                      <img
                        src={videoResult.thumbnail_url}
                        alt={videoResult.video_title}
                        className="w-full aspect-video object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-black ml-0.5" />
                        </div>
                      </div>
                    </button>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-2">{videoResult.video_title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{videoResult.channel_name}</span>
                      <span>{videoResult.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[9px] gap-1 text-primary p-0"
                        onClick={() => setInlineVideo(true)}
                      >
                        <Play className="w-2.5 h-2.5" /> Watch Here
                      </Button>
                      <a
                        href={`https://www.youtube.com/watch?v=${videoResult.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/30 p-4 text-center">
                  <p className="text-[10px] text-muted-foreground">No video found</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
