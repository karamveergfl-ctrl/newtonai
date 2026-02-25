import { ChevronDown } from "lucide-react";

interface NewNotesBadgeProps {
  count: number;
  onClick: () => void;
}

export function NewNotesBadge({ count, onClick }: NewNotesBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 animate-fade-in"
      aria-label={`${count} new notes added, click to scroll down`}
    >
      <ChevronDown className="w-3.5 h-3.5" />
      {count} new note{count !== 1 ? "s" : ""}
    </button>
  );
}
