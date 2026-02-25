import { useEffect, useRef } from "react";
import { useTermDefinitions } from "@/hooks/useTermDefinitions";
import { TermDefinitionItem } from "./TermDefinitionItem";
import { BookOpen } from "lucide-react";

interface TermDefinitionsSidebarProps {
  sessionId: string;
  slideIndex: number;
}

function SkeletonBar({ width }: { width: string }) {
  return (
    <div
      className="h-3 rounded skeleton-bar"
      style={{ width }}
    />
  );
}

function SkeletonItem() {
  return (
    <div className="px-3 py-3 border-b border-gray-700/50 space-y-2">
      <SkeletonBar width="40%" />
      <SkeletonBar width="90%" />
      <SkeletonBar width="70%" />
    </div>
  );
}

export function TermDefinitionsSidebar({ sessionId, slideIndex }: TermDefinitionsSidebarProps) {
  const {
    definitions,
    isLoading,
    isGenerating,
    error,
    expandedTermIndex,
    expandTerm,
    collapseAll,
  } = useTermDefinitions({ sessionId, slideIndex });

  const prevSlideRef = useRef(slideIndex);

  // Auto-expand first term on slide change
  useEffect(() => {
    if (slideIndex !== prevSlideRef.current) {
      prevSlideRef.current = slideIndex;
      collapseAll();
    }
    if (definitions?.status === "ready" && definitions.terms.length > 0 && expandedTermIndex === null) {
      expandTerm(0);
    }
  }, [slideIndex, definitions, expandedTermIndex, collapseAll, expandTerm]);

  const showSkeleton = isLoading || isGenerating || !definitions;

  return (
    <div className="flex flex-col h-full bg-gray-900/80 border-l border-gray-700/50">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-700/50">
        <BookOpen className="w-4 h-4 text-teal-400" />
        <span className="text-sm font-semibold text-gray-100">Key Terms</span>
        {isGenerating && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">
            Generating…
          </span>
        )}
        {!isGenerating && definitions?.status === "ready" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            Slide {slideIndex + 1}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {showSkeleton && (
          <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </>
        )}

        {!showSkeleton && error && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-400">Could not load term definitions</p>
          </div>
        )}

        {!showSkeleton && !error && definitions?.status === "failed" && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-400">Could not load term definitions</p>
          </div>
        )}

        {!showSkeleton && !error && definitions?.status === "ready" && definitions.terms.length === 0 && (
          <div className="flex items-center justify-center p-6">
            <p className="text-sm text-gray-400 text-center">No technical terms found for this slide</p>
          </div>
        )}

        {!showSkeleton && !error && definitions?.status === "ready" && definitions.terms.length > 0 && (
          definitions.terms.map((term, idx) => (
            <div
              key={`${definitions.slide_index}-${idx}`}
              className="term-stagger-item"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <TermDefinitionItem
                term={term}
                index={idx}
                isExpanded={expandedTermIndex === idx}
                onToggle={expandTerm}
              />
            </div>
          ))
        )}
      </div>

      <style>{`
        .skeleton-bar {
          background: linear-gradient(90deg, rgb(31,41,55) 25%, rgb(55,65,81) 50%, rgb(31,41,55) 75%);
          background-size: 200% 100%;
          animation: sidebar-shimmer 1.5s infinite;
        }
        @keyframes sidebar-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes term-fade-in {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .term-stagger-item {
          animation: term-fade-in 0.25s ease-out both;
        }
      `}</style>
    </div>
  );
}
