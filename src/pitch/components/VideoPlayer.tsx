import { ReactNode, useEffect, useRef, useState, MouseEvent } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
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

const stop = (e: MouseEvent) => e.stopPropagation();

export function VideoPlayer({ src, toolName, toolIcon, caption }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
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
  }, [src]);

  const toggle = (e: MouseEvent) => {
    stop(e);
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div className="flex flex-col items-center w-full" onClick={stop}>
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: 820, aspectRatio: "16 / 9", boxShadow: "0 20px 60px rgba(99,102,241,0.18)" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={stop}
      >
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: "rgba(99,102,241,0.95)", color: "white" }}>
          📹 Demo Video
        </div>

        {!src ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
            <div className="absolute inset-x-0 top-0 h-px" style={{
              background: "linear-gradient(90deg, transparent, #6366F1, transparent)",
              opacity: 0.4,
              animation: "pitchScan 2.4s linear infinite",
            }} />
            <div style={{ color: "#6366F1" }}>{toolIcon}</div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 18, marginTop: 14 }}>{toolName}</div>
            <div className="mt-3 px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(99,102,241,0.18)", color: "#A5B4FC", border: "1px solid rgba(99,102,241,0.4)" }}>
              ▶ Demo Video
            </div>
            <div style={{ color: "#64748B", fontStyle: "italic", fontSize: 12, marginTop: 12, maxWidth: 420, textAlign: "center" }}>
              Video recording coming soon — replace the src prop with your demo video URL
            </div>
            <style>{`@keyframes pitchScan { 0% { transform: translateY(0); } 100% { transform: translateY(100vh); } }`}</style>
          </div>
        ) : (
          <>
            <video ref={ref} src={src} className="w-full h-full object-contain bg-black" onClick={toggle} muted={muted} />
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
      <div style={{ color: "#64748B", fontStyle: "italic", fontSize: 13, marginTop: 12, maxWidth: 720, textAlign: "center" }}>
        {caption}
      </div>
    </div>
  );
}