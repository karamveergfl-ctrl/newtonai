import { Loader2, Play, Sparkles, X } from "lucide-react";
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

/** Full-panel animation-only video results (student text-to-video style rows). */
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
  const suggestions = query
    ? [`${query} animation`, `${query} 3d animation`, `${query} explained animation`]
    : ["Photosynthesis", "Newton's Laws", "Solar System"];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#0A0F1A]/98 backdrop-blur-sm">
      <div className="shrink-0 px-6 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Close
        </button>

        <div className="mt-4 flex items-center gap-2.5">
          <Sparkles className="h-6 w-6 shrink-0 text-teal-400" aria-hidden="true" />
          <h2 className="min-w-0 truncate text-2xl font-extrabold tracking-[-0.5px] text-white">{query}</h2>
        </div>
        <p className="mt-1.5 pb-3 text-[13px] text-slate-400">
          Animation videos
          {!loading && !error && videos.length > 0 && ` · ${videos.length} result${videos.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        {loading ? (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Finding animation videos for “{query}”…
            </p>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-2xl bg-[#151C2B] p-3">
                <div className="h-[112px] w-[200px] shrink-0 animate-pulse rounded-xl bg-slate-800" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 w-3/5 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center">
            <p className="text-base font-medium text-white">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 text-xs font-bold text-white hover:from-indigo-400 hover:to-indigo-500"
            >
              Retry search
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl" aria-hidden="true">😕</span>
            <p className="text-base text-white">No animation videos found for “{query}”</p>
            <p className="text-[13px] text-slate-500">Try a shorter topic or one of these</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
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
          <ul className="space-y-3">
            {videos.map((video) => (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => onPlay(video)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#151C2B] p-3 text-left transition-colors hover:border-indigo-500/40 hover:bg-[#19203046]"
                >
                  <span className="relative block h-[112px] w-[200px] shrink-0 overflow-hidden rounded-xl bg-[#0D1117]">
                    {video.thumbnail && (
                      <img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {video.duration}
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/90">
                        <Play className="h-5 w-5 text-white" fill="white" aria-hidden="true" />
                      </span>
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[17px] font-semibold leading-snug text-white">
                      {video.title}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-400">{video.channel}</span>
                    <span className="mt-1.5 flex items-center gap-3 text-[13px]">
                      <span className="font-medium text-teal-400">Animated</span>
                      {video.viewCount && <span className="text-slate-500">{video.viewCount}</span>}
                    </span>
                  </span>

                  <span className="mr-2 flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-5 text-sm font-bold text-white">
                    <Play className="h-4 w-4" fill="white" aria-hidden="true" />
                    Play for Class
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AnimationResultsPanel;