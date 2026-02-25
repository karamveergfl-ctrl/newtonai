import { useState, useRef, useEffect } from "react";
import { Star, Pencil, Trash2, ArrowRight, Lightbulb } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { NoteItem, StudentAnnotation } from "@/types/liveSession";

interface NoteItemRendererProps {
  item: NoteItem;
  itemIndex: number;
  slideNoteId: string;
  annotations: StudentAnnotation[];
  role: "teacher" | "student";
  onAddAnnotation: (index: number, type: "text_note" | "star", content: string) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  onUpdateAnnotation: (annotationId: string, content: string) => void;
}

export function NoteItemRenderer({
  item,
  itemIndex,
  annotations,
  role,
  onAddAnnotation,
  onRemoveAnnotation,
  onUpdateAnnotation,
}: NoteItemRendererProps) {
  const [showActions, setShowActions] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const starAnnotation = annotations.find(
    (a) => a.note_item_index === itemIndex && a.annotation_type === "star"
  );
  const textAnnotation = annotations.find(
    (a) => a.note_item_index === itemIndex && a.annotation_type === "text_note"
  );
  const isStarred = !!starAnnotation;

  useEffect(() => {
    if (editingNote && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingNote]);

  useEffect(() => {
    if (textAnnotation) setNoteContent(textAnnotation.content);
  }, [textAnnotation]);

  const handleStar = () => {
    if (isStarred) {
      onRemoveAnnotation(starAnnotation.id);
    } else {
      onAddAnnotation(itemIndex, "star", "");
    }
  };

  const handleOpenNote = () => {
    setEditingNote(true);
    setNoteContent(textAnnotation?.content ?? "");
  };

  const handleSaveNote = () => {
    setEditingNote(false);
    const trimmed = noteContent.trim();
    if (textAnnotation && trimmed) {
      onUpdateAnnotation(textAnnotation.id, trimmed);
    } else if (textAnnotation && !trimmed) {
      onRemoveAnnotation(textAnnotation.id);
    } else if (trimmed) {
      onAddAnnotation(itemIndex, "text_note", trimmed);
    }
  };

  const handleDeleteNote = () => {
    if (textAnnotation) onRemoveAnnotation(textAnnotation.id);
    setEditingNote(false);
    setNoteContent("");
  };

  const isStudent = role === "student";
  const isHeading = item.type === "heading";

  return (
    <div
      className="group relative"
      onMouseEnter={() => isStudent && !isHeading && setShowActions(true)}
      onMouseLeave={() => isStudent && setShowActions(false)}
      onTouchStart={() => isStudent && !isHeading && setShowActions(true)}
    >
      {/* Main item row */}
      <div
        className={cn(
          "flex items-start gap-2 py-1 px-2 rounded-md transition-colors duration-150",
          item.type === "heading" && "mt-3 first:mt-0",
          item.type === "remember" && "border-l-2 border-amber-400 bg-amber-950/20 pl-3",
          item.type === "detail" && "ml-4",
          isStarred && "bg-primary/5"
        )}
      >
        {/* Prefix icon/bullet */}
        {item.type === "key_point" && (
          <span className="text-primary mt-1 shrink-0 text-xs">●</span>
        )}
        {item.type === "detail" && (
          <ArrowRight className="w-3 h-3 text-muted-foreground mt-1.5 shrink-0" />
        )}
        {item.type === "remember" && (
          <Star className="w-3.5 h-3.5 text-amber-400 mt-1 shrink-0 fill-amber-400" />
        )}
        {item.type === "example" && (
          <Lightbulb className="w-3.5 h-3.5 text-primary mt-1 shrink-0" />
        )}

        {/* Content */}
        <span
          className={cn(
            "text-sm leading-relaxed flex-1",
            item.type === "heading" && "text-base font-bold text-foreground",
            item.type === "key_point" && "text-foreground",
            item.type === "detail" && "text-muted-foreground",
            item.type === "remember" && "text-amber-300 font-medium",
            item.type === "example" && "text-primary italic"
          )}
        >
          {item.content}
        </span>

        {/* Permanent star indicator */}
        {isStarred && !showActions && (
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mt-1 shrink-0" />
        )}

        {/* Hover actions (student only, non-heading) */}
        {isStudent && !isHeading && showActions && (
          <div className="flex items-center gap-1 shrink-0 ml-1 animate-fade-in">
            <button
              onClick={handleStar}
              className={cn(
                "p-1 rounded transition-colors",
                isStarred
                  ? "text-amber-400 hover:bg-amber-950/40"
                  : "text-muted-foreground hover:text-amber-400 hover:bg-muted"
              )}
              aria-label={isStarred ? "Unstar this point" : "Star this point"}
            >
              <Star className={cn("w-3.5 h-3.5", isStarred && "fill-amber-400")} />
            </button>
            <button
              onClick={handleOpenNote}
              className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              aria-label="Add a note"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Inline note editor */}
      {editingNote && (
        <div className="ml-6 mt-1 mb-2 animate-fade-in">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value.slice(0, 200))}
              onBlur={handleSaveNote}
              placeholder="Add your note here..."
              className="min-h-[60px] text-xs bg-card border-border resize-none"
              aria-label="Your annotation"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">
                {noteContent.length}/200
              </span>
              {textAnnotation && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDeleteNote();
                  }}
                  className="text-destructive hover:text-destructive/80 transition-colors p-0.5"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Display existing text annotation */}
      {!editingNote && textAnnotation && (
        <div className="ml-6 mt-1 mb-2 flex items-start gap-1.5 animate-fade-in">
          <div className="flex-1 bg-primary/5 border border-primary/10 rounded px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">📝 Your note:</p>
            <p className="text-xs text-primary/90">{textAnnotation.content}</p>
          </div>
          {isStudent && (
            <button
              onClick={handleOpenNote}
              className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0 mt-1"
              aria-label="Edit note"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
