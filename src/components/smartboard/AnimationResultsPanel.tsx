import { useEffect } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import VideoCard from "./VideoCard";
import type { SmartBoardVideo } from "@/lib/smartboardSession";

interface Props {
  videos: SmartBoardVideo[];
  loading: boolean;
  query: string;
  error: string | null;
  onPlay: (video: SmartBoardVideo) => void;
  onRetry: () => void;
  onSuggestion: (topic: string) => void;
  onClose: () => void;
}

const MAX_RESULTS = 6;

/** Docked animation-only results: exactly 6 cards, one frame, no scrolling. */
export function AnimationResultsPanel({
  videos,
  loading,
  query,
  error,
  onPlay,
  onRetry,
  onSuggestion,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shown = videos.slice(0, MAX_RESULTS);
  const suggestions = query
    ? [`${query} animation`, `${query} 3d animation`, `${query} explained animation`]
    : ["Photosynthesis", "Newton's Laws", "Solar System"];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#0A0F1A] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
      <div className="flex shrink-0 items-center gap-3 px-6 py-4">
        <Sparkles className="h-5 w-5 shrink-0 text-teal-400" aria-hidden="true" />
        <h2 className="min-w-0 truncate text-lg font-extrabold tracking-[-0.4px] text-white">{query}</h2>
        <span className="shrink-0 text-[12px] text-slate-400">
          {loading
            ? "Finding animation videos…"
            : error
              ? "Search failed"
              : `${shown.length} animation video${shown.length === 1 ? "" : "s"}`}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video results"
          className="ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6">
        {loading ? (
          <div className="grid h-full grid-cols-2 grid-rows-3 gap-5 min-[1100px]:grid-cols-3 min-[1100px]:grid-rows-2">
            {Array.from({ length: MAX_RESULTS }).map((_, i) => (
              <div key={i} className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[#151C2B]">
                <div className="min-h-0 flex-1 animate-pulse bg-slate-800" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/5 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-800" />
                </div>
              </div>
            ))}
            <span className="sr-only">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading
            </span>
          </div>
        ) : error ? (
          <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-base font-medium text-white">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 text-xs font-bold text-white hover:from-indigo-400 hover:to-indigo-500"
            >
              Retry search
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="text-5xl" aria-hidden="true">😕</span>
            <p className="text-base text-white">No animation videos found for “{query}”</p>
            <p className="text-[13px] text-slate-500">Try a shorter topic or one of these</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestion(s)}
                  className="h-8 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 grid-rows-3 gap-5 min-[1100px]:grid-cols-3 min-[1100px]:grid-rows-2">
            {shown.map((video) => (
              <VideoCard key={video.id} video={video} onPlay={onPlay} compact fill />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimationResultsPanel;