import { ReactNode, useEffect, useRef, useState, MouseEvent, ChangeEvent } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Upload, RotateCcw } from "lucide-react";
import { useToolVideo } from "../hooks/useToolVideo";

interface VideoPlayerProps {
  src?: string;
  toolKey?: string;
  toolName: string;
  toolIcon: ReactNode;
  caption: string;
}

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const stop = (e: MouseEvent | ChangeEvent) => e.stopPropagation();

export function VideoPlayer({ src, toolKey, toolName, toolIcon, caption }: VideoPlayerProps) {
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
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ width: "100%", maxWidth: 560, aspectRatio: "16 / 9", maxHeight: "100%", boxShadow: "0 20px 60px rgba(99,102,241,0.35)", border: "1px solid rgba(99,102,241,0.25)" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={stop}
      >
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: "rgba(99,102,241,0.95)", color: "white" }}>
          📹 Demo Video
        </div>
        {uploadedUrl && (
          <button onClick={(e) => { stop(e); clear(); }}
            className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
            style={{ background: "rgba(15,23,42,0.85)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
            <RotateCcw size={11} /> Replace
          </button>
        )}

        {!activeSrc ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
            <div className="absolute inset-x-0 top-0 h-px" style={{
              background: "linear-gradient(90deg, transparent, #6366F1, transparent)",
              opacity: 0.4,
              animation: "pitchScan 2.4s linear infinite",
            }} />
            <div style={{ color: "#818CF8", transform: "scale(0.75)" }}>{toolIcon}</div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginTop: 8, textAlign: "center", padding: "0 16px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{toolName}</div>
            <button onClick={onPick}
              className="mt-3 px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-transform hover:scale-105"
              style={{ background: "#6366F1", color: "white", boxShadow: "0 6px 20px rgba(99,102,241,0.4)", fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Upload size={12} /> Upload demo video
            </button>
            <div style={{ color: "#64748B", fontStyle: "italic", fontSize: 10, marginTop: 8, maxWidth: 320, textAlign: "center", padding: "0 12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Pick an MP4 from this device — stored locally, plays offline.
            </div>
            <style>{`@keyframes pitchScan { 0% { transform: translateY(0); } 100% { transform: translateY(100vh); } }`}</style>
          </div>
        ) : (
          <>
            <video ref={ref} src={activeSrc} className="w-full h-full object-contain bg-black" onClick={toggle} muted={muted} />
            {(!playing || hover) && (
              <button
                onClick={toggle}
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: playing ? "transparent" : "rgba(0,0,0,0.25)" }}
              >
                <div className="rounded-full flex items-center justify-center"
                  style={{ width: 64, height: 64, background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    animation: playing ? "none" : "pitchPulse 2s ease-in-out infinite" }}>
                  {playing ? <Pause size={26} color="#0F172A" /> : <Play size={28} color="#0F172A" style={{ marginLeft: 4 }} />}
                </div>
              </button>
            )}
            {hover && (
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-3"
                style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.85))" }} onClick={stop}>
                <button onClick={toggle}>{playing ? <Pause size={18} color="white" /> : <Play size={18} color="white" />}</button>
                <div className="flex-1 h-1 rounded-full cursor-pointer" style={{ background: "#334155" }}
                  onClick={(e) => { stop(e); const v = ref.current; if (!v) return;
                    const r = (e.target as HTMLDivElement).getBoundingClientRect();
                    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration; }}>
                  <div className="h-full rounded-full" style={{ width: `${dur ? (time / dur) * 100 : 0}%`, background: "#6366F1" }} />
                </div>
                <div style={{ color: "white", fontSize: 11, fontFamily: "monospace" }}>{fmt(time)} / {fmt(dur)}</div>
                <button onClick={(e) => { stop(e); setMuted(m => !m); }}>
                  {muted ? <VolumeX size={18} color="white" /> : <Volume2 size={18} color="white" />}
                </button>
                <button onClick={(e) => { stop(e); ref.current?.requestFullscreen?.(); }}>
                  <Maximize2 size={18} color="white" />
                </button>
              </div>
            )}
            <style>{`@keyframes pitchPulse { 0%,100% { transform: scale(1);} 50% { transform: scale(1.08);} }`}</style>
          </>
        )}
      </div>
      <div style={{ color: "#94A3B8", fontStyle: "italic", fontSize: 11.5, marginTop: 8, maxWidth: 560, textAlign: "center", lineHeight: 1.45, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {caption}
      </div>
    </div>
  );
}
