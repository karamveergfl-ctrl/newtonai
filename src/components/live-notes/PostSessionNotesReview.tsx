import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, FileDown, Hash, ArrowLeft, BookOpen } from "lucide-react";
import { SlideNotesCard } from "./SlideNotesCard";
import { useLiveNotes } from "@/hooks/useLiveNotes";
import { useStudentAnnotations } from "@/hooks/useStudentAnnotations";
import { useNotesExport } from "@/hooks/useNotesExport";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PostSessionNotesReviewProps {
  sessionId: string;
}

export function PostSessionNotesReview({ sessionId }: PostSessionNotesReviewProps) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("title, created_at")
        .eq("id", sessionId)
        .single();
      if (data) {
        setSessionTitle(data.title ?? "");
        setSessionDate(
          new Date(data.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        );
      }
    };
    fetchMeta();
  }, [sessionId]);

  const { slideNotesMap } = useLiveNotes({ sessionId, role: "student" });
  const { annotationsMap, addAnnotation, removeAnnotation, updateAnnotation } =
    useStudentAnnotations({ sessionId });
  const { isExporting, exportNotes } = useNotesExport({
    sessionId,
    studentId: userId ?? "",
  });

  const sortedSlides = Object.values(slideNotesMap)
    .filter((s) => s.status === "ready")
    .sort((a, b) => a.slide_index - b.slide_index);

  const totalAnnotations = Object.values(annotationsMap).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-sm font-semibold text-foreground truncate">
            Your Notes — {sessionTitle || "Session"} — {sessionDate}
          </h1>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {sortedSlides.length} slide{sortedSlides.length !== 1 ? "s" : ""} · {totalAnnotations}{" "}
            annotation{totalAnnotations !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={isExporting || sortedSlides.length === 0}
              onClick={() => exportNotes("pdf")}
              aria-label="Export as PDF"
            >
              <FileText className="w-3 h-3" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={isExporting || sortedSlides.length === 0}
              onClick={() => exportNotes("docx")}
              aria-label="Export as Word"
            >
              <FileDown className="w-3 h-3" /> Word
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={isExporting || sortedSlides.length === 0}
              onClick={() => exportNotes("md")}
              aria-label="Export as Markdown"
            >
              <Hash className="w-3 h-3" /> MD
            </Button>
          </div>
        </div>
      </div>

      {/* Notes list */}
      {sortedSlides.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 px-4">
          <BookOpen className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground text-center">
            No notes were generated in this session
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3 max-w-2xl mx-auto">
            {sortedSlides.map((slide) => (
              <SlideNotesCard
                key={slide.id}
                slideNotes={slide}
                annotations={annotationsMap[slide.id] ?? []}
                role="student"
                isCurrentSlide={false}
                onAddAnnotation={(noteId, idx, type, content) =>
                  addAnnotation(noteId, { note_item_index: idx, annotation_type: type, content })
                }
                onRemoveAnnotation={(noteId, annotationId) =>
                  removeAnnotation(noteId, annotationId)
                }
                onUpdateAnnotation={(noteId, annotationId, content) =>
                  updateAnnotation(noteId, annotationId, content)
                }
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Sticky bottom bar (mobile) */}
      {sortedSlides.length > 0 && (
        <div className="border-t border-border p-3 sm:hidden shrink-0">
          <Button
            className="w-full text-sm gap-1"
            disabled={isExporting}
            onClick={() => exportNotes("pdf")}
          >
            <FileText className="w-4 h-4" />
            {isExporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}
