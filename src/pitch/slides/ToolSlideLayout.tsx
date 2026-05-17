import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Play } from "lucide-react";
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

const FONT = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

export function ToolSlideLayout(p: ToolSlideLayoutProps) {
  return (
    <SlideShell theme="dark">
      <div className="absolute inset-0 flex flex-col" style={{ bottom: 52, fontFamily: FONT }}>
        {/* HEADER BAND ~16% */}
        <div className="flex items-start justify-between gap-8 px-14 pt-8 pb-4" style={{ flex: "0 0 auto" }}>
          <div className="flex-1 min-w-0">
            <motion.div
              variants={slideChild}
              className="inline-flex items-center px-3 py-1 rounded-full mb-3"
              style={{
                background: `${p.categoryColor}1F`,
                color: p.categoryColor,
                border: `1px solid ${p.categoryColor}55`,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              {p.category}
            </motion.div>
            <motion.h1
              variants={slideHeading}
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: "clamp(26px, 2.6vw, 38px)",
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {p.toolName}
            </motion.h1>
          </div>
          <motion.div
            variants={slideChild}
            className="rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              width: 72,
              height: 72,
              background: p.iconGradient,
              boxShadow: `0 14px 36px ${p.categoryColor}55`,
            }}
          >
            {p.icon}
          </motion.div>
        </div>

        {/* PROBLEM / SOLUTION COLUMNS ~32% */}
        <motion.div
          variants={slideChild}
          className="px-14 pb-4 grid grid-cols-2 gap-10"
          style={{ flex: "0 0 auto" }}
        >
          {/* PROBLEM */}
          <div className="rounded-xl p-5" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.28em",
                color: "#F87171", textTransform: "uppercase",
              }}>The Problem</span>
            </div>
            <p style={{
              fontFamily: FONT, color: "#CBD5E1",
              fontSize: 14, lineHeight: 1.6, margin: 0, fontWeight: 400,
            }}>{p.problem}</p>
          </div>

          {/* SOLUTION */}
          <div className="rounded-xl p-5" style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.22)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.28em",
                color: "#34D399", textTransform: "uppercase",
              }}>Newton's Solution</span>
            </div>
            <p style={{
              fontFamily: FONT, color: "#F1F5F9",
              fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 12, fontWeight: 500,
            }}>{p.solution}</p>
            <div className="space-y-1.5 pt-2" style={{ borderTop: "1px solid rgba(52,211,153,0.18)" }}>
              {p.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 pt-1.5">
                  <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ width: 14, height: 14, background: "rgba(16,185,129,0.2)" }}>
                    <Check size={9} color="#10B981" strokeWidth={3} />
                  </div>
                  <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.45, fontFamily: FONT }}>{h}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* VIDEO BAND — fills remaining space */}
        <div className="flex flex-col items-center px-8 pt-4 pb-4"
          style={{ flex: "1 1 auto", minHeight: 0, background: "linear-gradient(180deg, transparent, rgba(99,102,241,0.04))" }}>
          <div className="flex items-center gap-2 mb-2">
            <Play size={12} color={p.categoryColor} fill={p.categoryColor} />
            <span style={{
              color: p.categoryColor, fontSize: 10, fontWeight: 800,
              letterSpacing: "0.3em", fontFamily: FONT,
            }}>WATCH HOW IT WORKS</span>
          </div>
          <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 gap-2">
            <VideoPlayer src={p.videoSrc} toolKey={p.videoKey} toolName={p.toolName} toolIcon={p.icon} caption={p.videoCaption} />
            {p.extra && <div className="flex-shrink-0">{p.extra}</div>}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
