import { useEffect, useRef } from "react";
import { Maximize, X } from "lucide-react";
import type { SmartBoardVideo } from "@/lib/smartboardSession";

interface Props {
  video: SmartBoardVideo;
  upNext: SmartBoardVideo[];
  onSelect: (video: SmartBoardVideo) => void;
  onClose: () => void;
}

export function SmartBoardVideoPlayer({ video, upNext, onSelect, onClose }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const post = (func: string, args: unknown[] = []) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  };

  const goFullscreen = () => {
    const el = frameRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => undefined);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space") {
        e.preventDefault();
        post("pauseVideo");
      } else if (e.key.toLowerCase() === "f") {
        goFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/95 p-6">
      <iframe
        ref={frameRef}
        title={video.title}
        src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="h-[70vh] max-h-[790px] w-[90vw] max-w-[1400px] rounded-2xl border border-indigo-500/40 shadow-[0_0_60px_-10px_rgba(99,102,241,0.5)]"
      />

      <div className="flex w-[90vw] max-w-[1400px] flex-wrap items-center justify-between gap-4">
        <p className="max-w-[45%] truncate text-lg font-semibold text-white">{video.title}</p>
        <div className="flex items-center gap-2 rounded-full bg-emerald-900/40 px-4 py-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-base font-medium text-emerald-200">Playing for class</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goFullscreen}
            className="flex min-h-[64px] items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-6 text-lg font-semibold text-white hover:bg-slate-700"
          >
            <Maximize className="h-5 w-5" aria-hidden="true" /> Fullscreen
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[64px] items-center gap-2 rounded-xl bg-indigo-600 px-6 text-lg font-semibold text-white hover:bg-indigo-500"
          >
            <X className="h-5 w-5" aria-hidden="true" /> Close
          </button>
        </div>
      </div>

      {upNext.length > 0 && (
        <div className="w-[90vw] max-w-[1400px]">
          <p className="mb-2 text-base font-semibold uppercase tracking-wider text-slate-400">Up next</p>
          <div className="flex gap-4">
            {upNext.slice(0, 3).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v)}
                className="flex w-72 items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-2 text-left hover:border-indigo-500"
              >
                <img src={v.thumbnail} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
                <span className="line-clamp-2 text-base font-medium text-white">{v.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartBoardVideoPlayer;