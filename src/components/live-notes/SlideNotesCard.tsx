import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Star, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteItemRenderer } from "./NoteItemRenderer";
import type { SessionSlideNotes, StudentAnnotation } from "@/types/liveSession";

interface SlideNotesCardProps {
  slideNotes: SessionSlideNotes;
  annotations: StudentAnnotation[];
  role: "teacher" | "student";
  isCurrentSlide: boolean;
  onAddAnnotation: (slideNoteId: string, index: number, type: "text_note" | "star", content: string) => void;
  onRemoveAnnotation: (slideNoteId: string, annotationId: string) => void;
  onUpdateAnnotation: (slideNoteId: string, annotationId: string, content: string) => void;
  onRetry?: (slideIndex: number) => void;
}

export function SlideNotesCard({
  slideNotes,
  annotations,
  role,
  isCurrentSlide,
  onAddAnnotation,
  onRemoveAnnotation,
  onUpdateAnnotation,
  onRetry,
}: SlideNotesCardProps) {
  const noteCount = annotations.filter((a) => a.annotation_type === "text_note").length;
  const starCount = annotations.filter((a) => a.annotation_type === "star").length;
  const hasAnnotations = noteCount > 0 || starCount > 0;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all duration-300 bg-card",
        isCurrentSlide ? "border-primary/40 shadow-md shadow-primary/5" : "border-border",
        slideNotes.status === "failed" && "border-destructive/50",
        slideNotes.status === "ready" && "animate-fade-in"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="text-[10px] shrink-0">
            Slide {slideNotes.slide_index}
          </Badge>
          {slideNotes.slide_title && (
            <span className="text-sm font-semibold text-foreground truncate">
              {slideNotes.slide_title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isCurrentSlide && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-destructive">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              LIVE
            </span>
          )}
          {hasAnnotations && role === "student" && (
            <Badge variant="outline" className="text-[10px] gap-0.5">
              {starCount > 0 && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
              {noteCount > 0 && <Pencil className="w-2.5 h-2.5" />}
              {starCount + noteCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      {slideNotes.status === "generating" && (
        <div className="space-y-2 py-2">
          <div className="h-4 w-3/4 rounded notes-shimmer-bg" />
          <div className="h-3 w-full rounded notes-shimmer-bg" />
          <div className="h-3 w-5/6 rounded notes-shimmer-bg" />
          <p className="text-xs text-muted-foreground mt-2 animate-pulse">Generating notes…</p>
        </div>
      )}

      {slideNotes.status === "failed" && (
        <div className="flex items-center gap-2 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-xs text-destructive">
            {role === "teacher" ? "Notes failed to generate" : "Notes unavailable for this slide"}
          </span>
          {role === "teacher" && onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-xs h-7"
              onClick={() => onRetry(slideNotes.slide_index)}
              aria-label="Retry note generation"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          )}
        </div>
      )}

      {slideNotes.status === "ready" && (
        <div className="space-y-0.5">
          {slideNotes.ai_notes.map((noteItem, idx) => (
            <NoteItemRenderer
              key={idx}
              item={noteItem}
              itemIndex={idx}
              slideNoteId={slideNotes.id}
              annotations={annotations}
              role={role}
              onAddAnnotation={(index, type, content) =>
                onAddAnnotation(slideNotes.id, index, type, content)
              }
              onRemoveAnnotation={(annotationId) =>
                onRemoveAnnotation(slideNotes.id, annotationId)
              }
              onUpdateAnnotation={(annotationId, content) =>
                onUpdateAnnotation(slideNotes.id, annotationId, content)
              }
            />
          ))}
        </div>
      )}

      {/* Bottom annotation hint (student) */}
      {slideNotes.status === "ready" && role === "student" && !hasAnnotations && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Tap any point to annotate
        </p>
      )}

      {slideNotes.status === "ready" && role === "student" && hasAnnotations && (
        <p className="text-[10px] text-muted-foreground mt-2">
          {noteCount} note{noteCount !== 1 ? "s" : ""} · {starCount} star{starCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
