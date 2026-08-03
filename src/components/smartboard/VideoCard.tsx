import { Play } from "lucide-react";
import type { SmartBoardVideo } from "@/lib/smartboardSession";

interface Props {
  video: SmartBoardVideo;
  onPlay: (video: SmartBoardVideo) => void;
  compact?: boolean;
}

export function VideoCard({ video, onPlay, compact }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPlay(video)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay(video);
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] bg-[#151C2B] outline-none transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-[3px] hover:border-indigo-500/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] focus-visible:border-indigo-500"
    >
      <div className="relative aspect-video w-full bg-[#0D1117]">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt={`Thumbnail for ${video.title}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-black/70" />
        {video.duration && (
          <span className="absolute right-2 top-2 rounded-md bg-black/80 px-[7px] py-[2px] text-[11px] font-semibold text-white backdrop-blur-sm">
            {video.duration}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-indigo-500/90 shadow-[0_4px_20px_rgba(99,102,241,0.5)]">
            <Play className="h-5 w-5 text-white" fill="white" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="p-[14px]">
        <p className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-white">{video.title}</p>
        <div className="mt-[6px] flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-slate-500">{video.channel}</span>
          {video.viewCount && !compact && (
            <span className="shrink-0 text-[11px] text-slate-500">{video.viewCount}</span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlay(video);
          }}
          className="mt-[10px] flex h-[38px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-bold text-white transition-all duration-150 hover:from-indigo-400 hover:to-indigo-500 hover:scale-[1.01] active:scale-[0.98]"
        >
          <Play className="h-[13px] w-[13px]" fill="white" aria-hidden="true" />
          Play for Class
        </button>
      </div>
    </div>
  );
}

export default VideoCard;
