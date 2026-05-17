import { ChevronLeft, ChevronRight, Maximize2, Presentation } from "lucide-react";
import { MouseEvent } from "react";

interface BottomNavProps {
  current: number;
  total: number;
  title: string;
  presenterMode: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
  onPresenter: () => void;
}

const stop = (e: MouseEvent) => e.stopPropagation();

export function BottomNav({ current, total, title, presenterMode, onPrev, onNext, onFullscreen, onPresenter }: BottomNavProps) {
  const pct = ((current + 1) / total) * 100;

  if (presenterMode) {
    return (
      <div className="fixed bottom-4 right-4 z-[1000] px-3 py-2 rounded-full text-xs font-mono"
        style={{ background: "rgba(10,22,40,0.7)", color: "#94A3B8", backdropFilter: "blur(8px)" }}>
        {current + 1} / {total}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000]" style={{ height: 52,
      background: "rgba(10,22,40,0.95)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)" }} onClick={stop}>
      <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: "rgba(255,255,255,0.04)" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #818CF8, #6366F1)", transition: "width 300ms ease" }} />
      </div>
      <div className="h-full flex items-center justify-between px-5">
        <div style={{ color: "#6366F1", fontSize: 12, fontWeight: 700 }}>NewtonAI</div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { stop(e); onPrev(); }} disabled={current === 0}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-opacity"
            style={{ color: "#94A3B8", opacity: current === 0 ? 0.3 : 1 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ color: "#94A3B8", fontSize: 13, fontFamily: "monospace", padding: "0 12px" }}>
            {current + 1} / {total}
          </div>
          <button onClick={(e) => { stop(e); onNext(); }} disabled={current === total - 1}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-opacity"
            style={{ color: "#94A3B8", opacity: current === total - 1 ? 0.3 : 1 }}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={(e) => { stop(e); onFullscreen(); }} title="Fullscreen (F)" style={{ color: "#94A3B8" }}>
            <Maximize2 size={18} />
          </button>
          <button onClick={(e) => { stop(e); onPresenter(); }} title="Presenter mode (P)" style={{ color: "#94A3B8" }}>
            <Presentation size={18} />
          </button>
          <div className="hidden md:block truncate" style={{ color: "#475569", fontSize: 11, maxWidth: 200 }}>{title}</div>
        </div>
      </div>
    </div>
  );
}