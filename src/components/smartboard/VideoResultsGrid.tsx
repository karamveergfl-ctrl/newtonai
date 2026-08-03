import { Loader2 } from "lucide-react";
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
  columns?: string;
}

const SUBJECT_CARDS = [
  { name: "Science", emoji: "🔬", gradient: "from-[#064E3B] to-[#065F46]" },
  { name: "Mathematics", emoji: "📐", gradient: "from-[#1E1B4B] to-[#312E81]" },
  { name: "Physics", emoji: "⚛️", gradient: "from-[#451A03] to-[#78350F]" },
  { name: "Chemistry", emoji: "🧪", gradient: "from-[#450A0A] to-[#7F1D1D]" },
  { name: "History", emoji: "🏛️", gradient: "from-[#1C1917] to-[#292524]" },
  { name: "Geography", emoji: "🌍", gradient: "from-[#042F2E] to-[#134E4A]" },
];

const FALLBACKS = ["Photosynthesis", "Newton's Laws", "Solar System"];

export function VideoResultsGrid({ videos, loading, query, error, onPlay, onRetry, onSuggestion, columns }: Props) {
  const gridClass = columns ?? "grid-cols-1 sm:grid-cols-2 min-[1400px]:grid-cols-3";

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Finding the best videos for “{query}”…
        </p>
        <div className={`grid gap-4 ${gridClass}`}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[220px] overflow-hidden rounded-2xl bg-[#151C2B]">
              <div className="h-[55%] w-full animate-pulse rounded-t-2xl bg-slate-800" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-3/5 animate-pulse rounded bg-slate-800" />
                <div className="h-3 w-2/5 animate-pulse rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (query && videos.length === 0) {
    const suggestions = [`${query} animation`, `${query} for kids`, `${query} explained`];
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-5xl" aria-hidden="true">😕</span>
        <p className="text-base text-white">No videos found for “{query}”</p>
        <p className="text-[13px] text-slate-500">Try a different topic or use one of the quick topic chips above</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {(query ? suggestions : FALLBACKS).map((s) => (
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
    );
  }

  if (videos.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 min-[1400px]:grid-cols-3">
        {SUBJECT_CARDS.map((card) => (
          <button
            key={card.name}
            type="button"
            onClick={() => onSuggestion(card.name)}
            className={`flex h-[120px] flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br ${card.gradient} transition-transform duration-150 hover:scale-[1.02] hover:brightness-125`}
          >
            <span className="text-[40px] leading-none" aria-hidden="true">{card.emoji}</span>
            <span className="text-base font-bold text-white">{card.name}</span>
            <span className="text-xs text-white/70">Tap to explore →</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onPlay={onPlay} />
      ))}
    </div>
  );
}

export default VideoResultsGrid;
