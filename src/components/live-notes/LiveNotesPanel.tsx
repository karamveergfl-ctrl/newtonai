import { useEffect, useRef, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, FileDown, Hash, BookOpen } from "lucide-react";
import { SlideNotesCard } from "./SlideNotesCard";
import { NewNotesBadge } from "./NewNotesBadge";
import { useLiveNotes } from "@/hooks/useLiveNotes";
import { useStudentAnnotations } from "@/hooks/useStudentAnnotations";
import { useNotesExport } from "@/hooks/useNotesExport";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LiveNotesPanelProps {
  sessionId: string;
  role: "teacher" | "student";
}

export function LiveNotesPanel({ sessionId, role }: LiveNotesPanelProps) {
  const {
    slideNotesMap,
    currentSlideIndex,
    totalSlides,
    notesEnabled,
    latestNoteSlideIndex,
    retrySlideGeneration,
  } = useLiveNotes({ sessionId, role });

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const {
    annotationsMap,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    isSaving,
  } = useStudentAnnotations({ sessionId });

  const { isExporting, exportNotes } = useNotesExport({
    sessionId,
    studentId: userId ?? "",
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastSeenSlideRef = useRef<number | null>(null);

  const sortedSlides = Object.values(slideNotesMap).sort(
    (a, b) => a.slide_index - b.slide_index
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnseenCount(0);
  }, []);

  // Track scroll position
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    setIsNearBottom(nearBottom);
    if (nearBottom) setUnseenCount(0);
  }, []);

  // Auto-scroll or show badge when new notes arrive
  useEffect(() => {
    if (latestNoteSlideIndex === null) return;
    if (latestNoteSlideIndex === lastSeenSlideRef.current) return;
    lastSeenSlideRef.current = latestNoteSlideIndex;

    if (isNearBottom) {
      setTimeout(scrollToBottom, 150);
    } else {
      setUnseenCount((c) => c + 1);
    }
  }, [latestNoteSlideIndex, isNearBottom, scrollToBottom]);

  const handleAddAnnotation = (
    slideNoteId: string,
    index: number,
    type: "text_note" | "star",
    content: string
  ) => {
    addAnnotation(slideNoteId, { note_item_index: index, annotation_type: type, content });
  };

  const handleRemoveAnnotation = (slideNoteId: string, annotationId: string) => {
    removeAnnotation(slideNoteId, annotationId);
  };

  const handleUpdateAnnotation = (slideNoteId: string, annotationId: string, content: string) => {
    updateAnnotation(slideNoteId, annotationId, content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Live Notes</h3>
          {totalSlides > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Slide {currentSlideIndex} of {totalSlides}
            </span>
          )}
          {isSaving && (
            <span className="text-[10px] text-muted-foreground animate-pulse">Saving…</span>
          )}
        </div>

        {/* Export (student only) */}
        {role === "student" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={isExporting || sortedSlides.length === 0}
                aria-label="Export notes"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="end">
              <button
                onClick={() => exportNotes("pdf")}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-muted transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> Export as PDF
              </button>
              <button
                onClick={() => exportNotes("docx")}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-muted transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" /> Export as Word
              </button>
              <button
                onClick={() => exportNotes("md")}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-muted transition-colors"
              >
                <Hash className="w-3.5 h-3.5" /> Export as Markdown
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 min-h-0 relative">
        {!notesEnabled && (
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-sm text-muted-foreground text-center">
              Live notes are paused
            </p>
          </div>
        )}

        {notesEnabled && sortedSlides.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-4 gap-2">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground text-center">
              Notes will appear here as the teacher advances slides
            </p>
          </div>
        )}

        {notesEnabled && sortedSlides.length > 0 && (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3" onScroll={handleScroll}>
              {sortedSlides.map((slide) => (
                <SlideNotesCard
                  key={slide.id}
                  slideNotes={slide}
                  annotations={annotationsMap[slide.id] ?? []}
                  role={role}
                  isCurrentSlide={slide.slide_index === currentSlideIndex}
                  onAddAnnotation={handleAddAnnotation}
                  onRemoveAnnotation={handleRemoveAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                  onRetry={role === "teacher" ? retrySlideGeneration : undefined}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {/* Unseen notes badge */}
        {unseenCount > 0 && !isNearBottom && (
          <NewNotesBadge count={unseenCount} onClick={scrollToBottom} />
        )}
      </div>
    </div>
  );
}
