import { useEffect, useRef, useState } from "react";
import { Maximize2, Volume2, VolumeX, X } from "lucide-react";
import type { SmartBoardVideo } from "@/lib/smartboardSession";

interface Props {
  video: SmartBoardVideo;
  upNext: SmartBoardVideo[];
  onSelect: (video: SmartBoardVideo) => void;
  onClose: () => void;
}

export function SmartBoardVideoPlayer({ video, upNext, onSelect, onClose }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const post = (func: string, args: unknown[] = []) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  };

  const goFullscreen = () => {
    const el = shellRef.current ?? frameRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => undefined);
  };

  const toggleMute = () => {
    setMuted((m) => {
      post(m ? "unMute" : "mute");
      return !m;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space" || key === "k") {
        e.preventDefault();
        post("pauseVideo");
      } else if (key === "f") {
        goFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col transition-opacity duration-200"
      style={{ opacity: shown ? 1 : 0, background: "rgba(0,0,0,0.97)", backdropFilter: "blur(20px)" }}
    >
      {/* header */}
      <div className="flex h-[60px] shrink-0 items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          {video.thumbnail && (
            <img src={video.thumbnail} alt="" className="h-7 w-10 shrink-0 rounded-md object-cover" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{video.title}</p>
            <p className="truncate text-xs text-slate-400">{video.channel}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-300">Playing for class</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={muted ? "Unmute video" : "Mute video"}
            onClick={toggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Fullscreen"
            onClick={goFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Close video"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-900/60 text-red-300 hover:bg-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* player */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div
          ref={shellRef}
          className="overflow-hidden rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)]"
          style={{
            width: "min(90vw, calc(90vh * 16 / 9))",
            height: "min(85vh, calc(85vw * 9 / 16))",
          }}
        >
          <iframe
            ref={frameRef}
            title={video.title}
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      </div>

      {/* up next */}
      {upNext.length > 0 && (
        <div className="flex h-[100px] shrink-0 items-start gap-3 border-t border-white/[0.06] bg-white/[0.02] px-6 py-3">
          <p className="mt-1 shrink-0 text-[10px] uppercase tracking-[1.5px] text-slate-500">Up Next</p>
          <div className="flex gap-3 overflow-x-auto">
            {upNext.slice(0, 3).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v)}
                className="w-[140px] shrink-0 text-left"
              >
                <img
                  src={v.thumbnail}
                  alt=""
                  className="h-[79px] w-[140px] rounded-md object-cover transition-[filter] hover:brightness-110"
                />
                <p className="mt-1.5 line-clamp-1 text-[11px] text-white">{v.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartBoardVideoPlayer;
