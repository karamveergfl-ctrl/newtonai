import { SearchX } from "lucide-react";
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

const SUGGESTIONS = ["Photosynthesis", "Newton's Laws", "Solar System"];

export function VideoResultsGrid({ videos, loading, query, error, onPlay, onRetry, onSuggestion, columns }: Props) {
  const gridClass = columns ?? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-lg text-slate-400">Searching for videos...</p>
        <div className={`grid gap-5 ${gridClass}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
              <div className="aspect-video w-full bg-slate-700" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-full rounded bg-slate-700" />
                <div className="h-4 w-2/3 rounded bg-slate-700" />
                <div className="h-10 w-full rounded-lg bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/40 bg-red-950/30 p-10 text-center">
        <p className="text-2xl font-semibold text-white">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 min-h-[64px] rounded-xl bg-indigo-600 px-10 text-lg font-semibold text-white hover:bg-indigo-500"
        >
          Retry search
        </button>
      </div>
    );
  }

  if (query && videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <SearchX className="h-16 w-16 text-slate-600" aria-hidden="true" />
        <p className="text-2xl font-semibold text-white">No videos found for “{query}”</p>
        <p className="text-lg text-slate-400">Try a different topic or check the spelling</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s)}
              className="min-h-[52px] rounded-full border border-slate-600 bg-slate-700 px-6 text-base font-medium text-slate-200 hover:border-indigo-500 hover:bg-indigo-900 hover:text-indigo-200"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <div className="space-y-4">
      {query && (
        <p className="text-lg text-slate-400">
          {videos.length} videos found for “<span className="text-white">{query}</span>”
        </p>
      )}
      <div className={`grid gap-5 ${gridClass}`}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
}

export default VideoResultsGrid;