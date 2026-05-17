import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { VideoPlayer } from "../components/VideoPlayer";

interface ToolSlideLayoutProps {
  category: string;
  categoryColor: string;
  toolName: string;
  problem: string;
  solution: string;
  highlights: string[];
  icon: ReactNode;
  iconGradient: string;
  videoSrc?: string;
  videoKey?: string;
  videoCaption: string;
  extra?: ReactNode;
}

export function ToolSlideLayout(p: ToolSlideLayoutProps) {
  return (
    <SlideShell theme="dark">
      {/* TOP ROW 40% */}
      <div className="absolute inset-x-0 top-0 flex" style={{ height: "40%" }}>
        <div className="flex-1 px-14 pt-14 pb-4 flex flex-col justify-center" style={{ maxWidth: "70%" }}>
          <motion.div variants={slideChild} className="inline-flex self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ background: `${p.categoryColor}22`, color: p.categoryColor, border: `1px solid ${p.categoryColor}55` }}>
            {p.category}
          </motion.div>
          <motion.h1 variants={slideHeading} style={{ fontWeight: 800, fontSize: "clamp(22px,2.6vw,36px)", color: "white", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>
            {p.toolName}
          </motion.h1>
          <motion.div variants={slideChild} className="grid grid-cols-2 gap-4">
            <div>
              <div style={{ color: "#F87171", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>❌ THE PROBLEM</div>
              <div style={{ color: "#94A3B8", fontSize: 12.5, lineHeight: 1.5 }}>{p.problem}</div>
            </div>
            <div>
              <div style={{ color: "#34D399", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>✅ NEWTON'S SOLUTION</div>
              <div style={{ color: "white", fontSize: 12.5, lineHeight: 1.5 }}>{p.solution}</div>
            </div>
          </motion.div>
        </div>
        <div className="px-8 pt-10 pb-4 flex flex-col items-end justify-between" style={{ width: "30%" }}>
          <motion.div variants={slideChild} className="rounded-2xl flex items-center justify-center"
            style={{ width: 80, height: 80, background: p.iconGradient, boxShadow: "0 12px 32px rgba(99,102,241,0.3)" }}>
            {p.icon}
          </motion.div>
          <motion.div variants={slideChild} className="w-full space-y-2">
            {p.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ width: 16, height: 16, background: "#10B98122" }}>
                  <Check size={10} color="#10B981" strokeWidth={3} />
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", lineHeight: 1.4 }}>{h}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ROW 60% — ends above the 52px nav */}
      <div className="absolute inset-x-0 flex flex-col items-center px-8 pt-3"
        style={{ top: "40%", bottom: 52, background: "#F8FAFC" }}>
        <div className="w-full max-w-5xl mb-1.5">
          <div style={{ color: "#6366F1", fontSize: 10, fontWeight: 700, letterSpacing: "0.25em" }}>WATCH HOW IT WORKS</div>
        </div>
        <div className="flex-1 w-full flex items-center justify-center min-h-0 pb-3">
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 min-h-0">
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
              <VideoPlayer src={p.videoSrc} toolKey={p.videoKey} toolName={p.toolName} toolIcon={p.icon} caption={p.videoCaption} />
            </div>
            {p.extra && <div className="flex-shrink-0">{p.extra}</div>}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
