import { ReactNode, useEffect, useRef, useState, MouseEvent, ChangeEvent } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Upload, RotateCcw } from "lucide-react";
import { useToolVideo } from "../hooks/useToolVideo";

interface VideoPlayerProps {
  src?: string;
  toolKey?: string;
  toolName: string;
  toolIcon: ReactNode;
  caption: string;
  maxWidth?: number | string;
}

const FONT = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const stop = (e: MouseEvent | ChangeEvent) => e.stopPropagation();

export function VideoPlayer({ src, toolKey, toolName, toolIcon, caption, maxWidth = 620 }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { url: uploadedUrl, upload, clear } = useToolVideo(toolKey);
  const activeSrc = src || uploadedUrl || "";

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => setTime(v.currentTime);
    const onLoad = () => setDur(v.duration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoad);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoad);
    };
  }, [activeSrc]);

  const toggle = (e: MouseEvent) => {
    stop(e);
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const onPick = (e: MouseEvent) => { stop(e); fileRef.current?.click(); };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    stop(e);
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col items-center w-full" onClick={stop} data-interactive>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onFile} />
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "100%",
          aspectRatio: "16 / 9",
          boxShadow: "0 18px 50px rgba(99,102,241,0.18)",
          border: "1px solid rgba(99,102,241,0.22)",
          background: "white",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={stop}
      >
        {uploadedUrl && (
          <button
            onClick={(e) => { stop(e); clear(); }}
            className="absolute top-2.5 right-2.5 z-10 px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              background: "rgba(15,23,42,0.85)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 10,
              fontWeight: 600,
              fontFamily: FONT,
            }}
          >
            <RotateCcw size={10} /> Replace
          </button>
        )}

        {!activeSrc ? (
          <div
            className="relative w-full h-full flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)" }}
          >
            <div style={{ color: "#6366F1", transform: "scale(0.7)" }}>{toolIcon}</div>
            <div
              style={{
                color: "#0F172A",
                fontWeight: 600,
                fontSize: 13,
                marginTop: 6,
                textAlign: "center",
                padding: "0 16px",
                fontFamily: FONT,
              }}
            >
              {toolName}
            </div>
            <button
              onClick={onPick}
              className="mt-3 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5"
              style={{
                background: "#6366F1",
                color: "white",
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                fontSize: 11,
                fontFamily: FONT,
              }}
            >
              <Upload size={11} /> Upload demo video
            </button>
          </div>
        ) : (
          <>
            <video
              ref={ref}
              src={activeSrc}
              className="w-full h-full object-contain bg-black"
              onClick={toggle}
              muted={muted}
            />
            {(!playing || hover) && (
              <button
                onClick={toggle}
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: playing ? "transparent" : "rgba(0,0,0,0.25)" }}
              >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 58, height: 58, background: "white", boxShadow: "0 8px 28px rgba(0,0,0,0.4)" }}
                >
                  {playing ? <Pause size={24} color="#0F172A" /> : <Play size={26} color="#0F172A" style={{ marginLeft: 3 }} />}
                </div>
              </button>
            )}
            {hover && (
              <div
                className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-3"
                style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.85))" }}
                onClick={stop}
              >
                <button onClick={toggle}>{playing ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}</button>
                <div
                  className="flex-1 h-1 rounded-full cursor-pointer"
                  style={{ background: "#334155" }}
                  onClick={(e) => {
                    stop(e);
                    const v = ref.current;
                    if (!v) return;
                    const r = (e.target as HTMLDivElement).getBoundingClientRect();
                    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
                  }}
                >
                  <div className="h-full rounded-full" style={{ width: `${dur ? (time / dur) * 100 : 0}%`, background: "#6366F1" }} />
                </div>
                <div style={{ color: "white", fontSize: 10.5, fontFamily: "monospace" }}>
                  {fmt(time)} / {fmt(dur)}
                </div>
                <button onClick={(e) => { stop(e); setMuted(m => !m); }}>
                  {muted ? <VolumeX size={16} color="white" /> : <Volume2 size={16} color="white" />}
                </button>
                <button
                  onClick={(e) => {
                    stop(e);
                    // Fullscreen the whole slide (document), not just the video,
                    // so the cards + video + caption all stay visible like the
                    // in-editor preview.
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    } else {
                      document.documentElement.requestFullscreen().catch(() => {});
                    }
                  }}
                >
                  <Maximize2 size={16} color="white" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div
        style={{
          color: "#475569",
          fontStyle: "italic",
          fontSize: 14.5,
          marginTop: 10,
          maxWidth,
          textAlign: "center",
          lineHeight: 1.45,
          fontFamily: FONT,
        }}
      >
        {caption}
      </div>
    </div>
  );
}
