import { ReactNode } from "react";
import { SlideShell } from "../components/SlideShell";
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
}

const FONT = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

export function ToolSlideLayout(p: ToolSlideLayoutProps) {
  return (
    <SlideShell theme="dark">
      <div
        className="absolute inset-x-0 flex flex-col"
        style={{ top: 0, bottom: 52, fontFamily: FONT }}
      >
        {/* HEADER STRIP */}
        <div className="flex items-center justify-between gap-6 px-12 pt-7 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div
              className="inline-flex items-center px-2.5 py-1 rounded-full mb-2"
              style={{
                background: `${p.categoryColor}1F`,
                color: p.categoryColor,
                border: `1px solid ${p.categoryColor}55`,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              {p.category}
            </div>
            <h1
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: "clamp(20px, 2vw, 28px)",
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              {p.toolName}
            </h1>
          </div>
          <div
            className="rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              width: 60,
              height: 60,
              background: p.iconGradient,
              boxShadow: `0 10px 28px ${p.categoryColor}55`,
            }}
          >
            <div style={{ transform: "scale(0.78)" }}>{p.icon}</div>
          </div>
        </div>

        {/* 3-COLUMN BODY: PROBLEM | VIDEO | SOLUTION */}
        <div
          className="flex-1 min-h-0 grid items-center gap-7 px-12 pb-6"
          style={{ gridTemplateColumns: "1fr 1.25fr 1fr" }}
        >
          {/* PROBLEM */}
          <div
            className="rounded-xl p-5 self-stretch flex flex-col"
            style={{
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.20)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.28em",
                color: "#F87171",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              The Problem
            </div>
            <p
              style={{
                fontFamily: FONT,
                color: "#CBD5E1",
                fontSize: 13.5,
                lineHeight: 1.6,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {p.problem}
            </p>
          </div>

          {/* VIDEO */}
          <div className="flex flex-col items-center justify-center min-w-0">
            <VideoPlayer
              src={p.videoSrc}
              toolKey={p.videoKey}
              toolName={p.toolName}
              toolIcon={p.icon}
              caption={p.videoCaption}
            />
          </div>

          {/* SOLUTION */}
          <div
            className="rounded-xl p-5 self-stretch flex flex-col"
            style={{
              background: "rgba(52,211,153,0.07)",
              border: "1px solid rgba(52,211,153,0.22)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.28em",
                color: "#34D399",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Newton's Solution
            </div>
            <p
              style={{
                fontFamily: FONT,
                color: "#F1F5F9",
                fontSize: 13.5,
                lineHeight: 1.6,
                margin: 0,
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              {p.solution}
            </p>
            <div
              className="space-y-2 pt-3 mt-auto"
              style={{ borderTop: "1px solid rgba(52,211,153,0.18)" }}
            >
              {p.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    style={{
                      color: "#10B981",
                      fontSize: 12,
                      fontWeight: 800,
                      lineHeight: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#CBD5E1",
                      lineHeight: 1.5,
                      fontFamily: FONT,
                    }}
                  >
                    {h}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
