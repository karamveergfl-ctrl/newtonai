import { Play } from "lucide-react";
import type { SmartBoardVideo } from "@/lib/smartboardSession";

interface Props {
  video: SmartBoardVideo;
  onPlay: (video: SmartBoardVideo) => void;
  compact?: boolean;
}

export function VideoCard({ video, onPlay, compact }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition-transform hover:scale-[1.02]">
      <div className="relative aspect-video w-full bg-slate-900">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt={`Thumbnail for ${video.title}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
        {video.duration && (
          <span className="absolute right-2 top-2 rounded bg-slate-900/80 px-2 py-1 text-sm font-medium text-white">
            {video.duration}
          </span>
        )}
        {video.definition === "hd" && (
          <span className="absolute left-2 top-2 rounded bg-indigo-600/90 px-2 py-1 text-xs font-bold tracking-wide text-white">
            HD
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-base font-semibold leading-snug text-white">{video.title}</p>
        <p className="text-base text-slate-400">{video.channel}</p>
        {video.viewCount && !compact && <p className="text-base text-slate-500">{video.viewCount}</p>}
      </div>
      <div className="p-3 pt-0">
        <button
          type="button"
          onClick={() => onPlay(video)}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-lg font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          Play
        </button>
      </div>
    </div>
  );
}

export default VideoCard;