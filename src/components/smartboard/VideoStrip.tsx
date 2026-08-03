import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Play, Plus, Sparkles, X } from "lucide-react";
import type { SmartBoardVideo } from "@/lib/smartboardSession";

interface Props {
  videos: SmartBoardVideo[];
  loading: boolean;
  query: string;
  error: string | null;
  onPlay: (video: SmartBoardVideo) => void;
  onDismiss: () => void;
  onRetry: () => void;
}

const PAGE = 5;

/** Thin, horizontally scrolling animation-video rail docked above the document. */
export function VideoStrip({ videos, loading, query, error, onPlay, onDismiss, onRetry }: Props) {
  const [shown, setShown] = useState(PAGE);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setShown(PAGE);
    setCollapsed(false);
  }, [query]);

  if (!query && !loading) return null;

  return (
    <div className="shrink-0 border-b border-slate-800 bg-[#0C1B33]">
      <div className="flex items-center gap-3 px-4 py-2">
        <Sparkles className="h-5 w-5 shrink-0 text-teal-400" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-base font-semibold text-white">
          Animation videos — <span className="text-teal-300">{query}</span>
          {!loading && !error && videos.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">
              showing {Math.min(shown, videos.length)} of {videos.length}
            </span>
          )}
        </p>
        <button
          type="button"
          aria-label={collapsed ? "Show video results" : "Hide video results"}
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button
          type="button"
          aria-label="Close video results"
          onClick={onDismiss}
          className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-3">
          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: PAGE }).map((_, i) => (
                <div key={i} className="h-[76px] w-[300px] shrink-0 animate-pulse rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-4">
              <p className="text-base text-red-300">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-base font-semibold text-white hover:bg-indigo-500"
              >
                Retry
              </button>
            </div>
          ) : videos.length === 0 ? (
            <p className="py-2 text-base text-slate-400">No animation videos found for this topic.</p>
          ) : (
            <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
              {videos.slice(0, shown).map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => onPlay(video)}
                  className="group flex w-[300px] shrink-0 items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-left hover:border-teal-500 hover:bg-slate-800"
                >
                  <span className="relative block h-[60px] w-[106px] shrink-0 overflow-hidden rounded-lg bg-slate-900">
                    {video.thumbnail && (
                      <img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 text-xs font-medium text-white">
                        {video.duration}
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-sm font-semibold leading-snug text-white">
                      {video.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-400">{video.channel}</span>
                  </span>
                </button>
              ))}

              {shown < videos.length && (
                <button
                  type="button"
                  onClick={() => setShown((s) => s + PAGE)}
                  className="flex w-[140px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-600 text-base font-semibold text-slate-300 hover:border-teal-500 hover:text-teal-300"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  Load more
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoStrip;
