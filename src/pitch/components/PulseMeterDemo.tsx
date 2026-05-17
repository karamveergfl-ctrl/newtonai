import { MouseEvent, useState } from "react";

const stop = (e: MouseEvent) => e.stopPropagation();

export function PulseMeterDemo() {
  const [bars, setBars] = useState({ green: 70, amber: 20, red: 10 });

  const click = (key: "green" | "amber" | "red") => {
    setBars(prev => {
      const inc = 5;
      const others = (["green", "amber", "red"] as const).filter(k => k !== key);
      const remaining = prev[others[0]] + prev[others[1]];
      if (remaining <= 0) return prev;
      const newVal = Math.min(100, prev[key] + inc);
      const dec = newVal - prev[key];
      const ratio = dec / remaining;
      return {
        ...prev,
        [key]: newVal,
        [others[0]]: Math.max(0, prev[others[0]] - prev[others[0]] * ratio),
        [others[1]]: Math.max(0, prev[others[1]] - prev[others[1]] * ratio),
      } as typeof prev;
    });
  };

  const alert = bars.red >= 50;

  return (
    <div className="w-full max-w-2xl mx-auto mt-6" onClick={stop}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "#6366F1" }}>
        Live Demo: Simulate a student response →
      </div>
      <div className="flex gap-3 mb-5">
        <DemoBtn label="✅ Got It" color="#10B981" onClick={() => click("green")} />
        <DemoBtn label="😐 Slightly Lost" color="#F59E0B" onClick={() => click("amber")} />
        <DemoBtn label="❓ Lost" color="#EF4444" onClick={() => click("red")} />
      </div>
      {alert && (
        <div className="mb-2 inline-block px-3 py-1 rounded-full text-[12px] font-bold"
          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444",
            border: "1px solid rgba(239,68,68,0.4)", animation: "pitchBlink 1s ease-in-out infinite" }}>
          ⚠ ALERT: Understanding dropped below 50%
        </div>
      )}
      <div className="flex text-[11px] font-mono mb-1" style={{ color: "#475569" }}>
        <div style={{ width: `${bars.green}%` }}>{Math.round(bars.green)}%</div>
        <div style={{ width: `${bars.amber}%` }}>{Math.round(bars.amber)}%</div>
        <div style={{ width: `${bars.red}%` }}>{Math.round(bars.red)}%</div>
      </div>
      <div className="w-full h-6 rounded-full overflow-hidden flex"
        style={{ boxShadow: alert ? "0 0 20px rgba(239,68,68,0.6)" : "none", transition: "box-shadow 300ms" }}>
        <div style={{ width: `${bars.green}%`, background: "#10B981", transition: "width 600ms ease" }} />
        <div style={{ width: `${bars.amber}%`, background: "#F59E0B", transition: "width 600ms ease" }} />
        <div style={{ width: `${bars.red}%`, background: "#EF4444", transition: "width 600ms ease" }} />
      </div>
      <style>{`@keyframes pitchBlink { 0%,100% { opacity: 1;} 50% { opacity: 0.5;} }`}</style>
    </div>
  );
}

function DemoBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <button
      onClick={(e) => { stop(e); onClick(); setSent(true); setTimeout(() => setSent(false), 800); }}
      className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
      style={{ border: `1px solid ${color}`, color: sent ? "white" : color, background: sent ? color : "transparent" }}
    >
      {sent ? "Sent! ✓" : label}
    </button>
  );
}