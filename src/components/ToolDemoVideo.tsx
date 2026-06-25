import { useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE =
  "https://tdvsxaxmwmhpvsdpvbvc.supabase.co/storage/v1/object/public/pitch-videos";

export const TOOL_DEMO_VIDEOS: Record<string, { src: string; caption: string }> = {
  quiz: {
    src: `${BASE}/quiz.mp4`,
    caption: "Watch Newton generate a personalised quiz from your notes in seconds.",
  },
  flashcards: {
    src: `${BASE}/flashcards.mp4`,
    caption: "See how Newton turns any document into smart, flippable flashcards.",
  },
  podcast: {
    src: `${BASE}/podcast.mp4`,
    caption: "Two AI hosts discuss your topic — interrupt anytime with a doubt.",
  },
  summarizer: {
    src: `${BASE}/summary.mp4`,
    caption: "Summarise a 45-page chapter into a structured study guide in 12 seconds.",
  },
  "homework-help": {
    src: `${BASE}/homework_help.mp4`,
    caption: "Snap a problem — Newton solves it step-by-step with cited formulas.",
  },
  "mind-map": {
    src: `${BASE}/mindmap.mp4`,
    caption: "Visualise any topic as an interactive, zoomable mind map.",
  },
  "pdf-chat": {
    src: `${BASE}/chat_pdf.mp4`,
    caption: "Chat with any PDF — answers grounded in your document, with page citations.",
  },
};

interface ToolDemoVideoProps {
  toolId: keyof typeof TOOL_DEMO_VIDEOS;
  className?: string;
}

export function ToolDemoVideo({ toolId, className }: ToolDemoVideoProps) {
  const [open, setOpen] = useState(false);
  const demo = TOOL_DEMO_VIDEOS[toolId];
  if (!demo) return null;

  return (
    <div className={cn("w-full max-w-3xl mx-auto mb-6", className)}>
      {!open ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full h-auto py-3 px-4 flex items-center gap-3 justify-start border-primary/30 hover:border-primary/60 hover:bg-primary/5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <Play className="h-4 w-4 fill-current" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-semibold text-foreground">Watch a 30-second demo</span>
            <span className="block text-xs text-muted-foreground line-clamp-1">{demo.caption}</span>
          </span>
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
            <span className="text-xs font-medium text-muted-foreground line-clamp-1">{demo.caption}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close demo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <video
            src={demo.src}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-auto bg-black aspect-video"
          />
        </div>
      )}
    </div>
  );
}

export default ToolDemoVideo;