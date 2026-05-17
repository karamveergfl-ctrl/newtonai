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
  videoSrc: string;
  videoCaption: string;
  extra?: ReactNode;
}

export function ToolSlideLayout(p: ToolSlideLayoutProps) {
  return (
    <SlideShell theme="dark">
      {/* TOP ROW 45% */}
      <div className="absolute inset-x-0 top-0 flex" style={{ height: "45%" }}>
        <div className="flex-1 px-16 pt-20 pb-6 flex flex-col justify-center" style={{ maxWidth: "70%" }}>
          <motion.div variants={slideChild} className="inline-flex self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] mb-3"
            style={{ background: `${p.categoryColor}22`, color: p.categoryColor, border: `1px solid ${p.categoryColor}55` }}>
            {p.category}
          </motion.div>
          <motion.h1 variants={slideHeading} style={{ fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", color: "white", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 18 }}>
            {p.toolName}
          </motion.h1>
          <motion.div variants={slideChild} className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div style={{ color: "#F87171", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>❌ THE PROBLEM</div>
              <div style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.55 }}>{p.problem}</div>
            </div>
            <div>
              <div style={{ color: "#34D399", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>✅ NEWTON'S SOLUTION</div>
              <div style={{ color: "white", fontSize: 14, lineHeight: 1.55 }}>{p.solution}</div>
            </div>
          </motion.div>
        </div>
        <div className="px-10 py-10 flex flex-col items-end justify-between" style={{ width: "30%" }}>
          <motion.div variants={slideChild} className="rounded-2xl flex items-center justify-center"
            style={{ width: 96, height: 96, background: p.iconGradient, boxShadow: "0 12px 32px rgba(99,102,241,0.3)" }}>
            {p.icon}
          </motion.div>
          <motion.div variants={slideChild} className="w-full space-y-2.5">
            {p.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ width: 18, height: 18, background: "#10B98122" }}>
                  <Check size={11} color="#10B981" strokeWidth={3} />
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>{h}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ROW 55% */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-10 pt-6 pb-16" style={{ height: "55%", background: "#F8FAFC" }}>
        <div className="w-full max-w-5xl mb-3">
          <div style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: "0.25em" }}>WATCH HOW IT WORKS</div>
        </div>
        <div className="flex-1 w-full flex items-center justify-center min-h-0">
          <div className="w-full flex flex-col items-center" style={{ maxHeight: "100%" }}>
            <VideoPlayer src={p.videoSrc} toolName={p.toolName} toolIcon={p.icon} caption={p.videoCaption} />
            {p.extra}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}