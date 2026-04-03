import { useState, useEffect, useCallback, useRef } from "react";
import { Video, FileQuestion, Lightbulb, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextSelectionMenuProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onSearchVideo?: (text: string) => void;
  onGenerateQuiz?: (text: string) => void;
  onExplain?: (text: string) => void;
  onAddToNotes?: (text: string) => void;
}

const ACTIONS = [
  { key: "video", icon: Video, label: "Search Video", color: "text-red-500" },
  { key: "quiz", icon: FileQuestion, label: "Generate Quiz", color: "text-primary" },
  { key: "explain", icon: Lightbulb, label: "Explain", color: "text-amber-500" },
  { key: "notes", icon: StickyNote, label: "Add to Notes", color: "text-emerald-500" },
] as const;

export function TextSelectionMenu({
  containerRef,
  onSearchVideo,
  onGenerateQuiz,
  onExplain,
  onAddToNotes,
}: TextSelectionMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (!text || text.length < 3) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const range = sel?.getRangeAt(0);
    if (!range) return;

    // Ensure selection is within our container
    if (!container.contains(range.commonAncestorContainer)) {
      setPosition(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelectedText(text);
    setPosition({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 8,
    });
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mouseup", handleSelection);
    container.addEventListener("touchend", handleSelection);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null);
        setSelectedText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      container.removeEventListener("mouseup", handleSelection);
      container.removeEventListener("touchend", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef, handleSelection]);

  const handleAction = (key: string) => {
    const text = selectedText;
    setPosition(null);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();

    switch (key) {
      case "video": onSearchVideo?.(text); break;
      case "quiz": onGenerateQuiz?.(text); break;
      case "explain": onExplain?.(text); break;
      case "notes": onAddToNotes?.(text); break;
    }
  };

  if (!position || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 animate-fade-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex items-center gap-0.5 bg-popover border border-border rounded-xl shadow-lg px-1.5 py-1">
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            onClick={() => handleAction(action.key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              "hover:bg-accent text-popover-foreground"
            )}
            title={action.label}
          >
            <action.icon className={cn("w-3.5 h-3.5", action.color)} />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-2.5 h-2.5 bg-popover border-b border-r border-border rotate-45 -mt-[5px]" />
      </div>
    </div>
  );
}
