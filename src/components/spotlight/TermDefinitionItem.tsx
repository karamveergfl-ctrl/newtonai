import { ChevronRight } from "lucide-react";
import type { TermDefinition } from "@/types/liveSession";

interface TermDefinitionItemProps {
  term: TermDefinition;
  index: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
}

export function TermDefinitionItem({ term, index, isExpanded, onToggle }: TermDefinitionItemProps) {
  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <button
        className="w-full flex items-center justify-between px-3 py-3 min-h-[44px] text-left hover:bg-gray-800/50 transition-colors duration-150"
        onClick={() => onToggle(index)}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} definition for ${term.term}`}
        aria-expanded={isExpanded}
      >
        <span className="text-teal-400 font-semibold truncate pr-2">{term.term}</span>
        <ChevronRight
          className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
          style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: isExpanded ? "120px" : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-3 pb-3">
          <p className="text-sm text-gray-200">{term.definition}</p>
          {term.context && (
            <p className="text-xs text-gray-400 italic mt-1">
              In this slide: {term.context}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
