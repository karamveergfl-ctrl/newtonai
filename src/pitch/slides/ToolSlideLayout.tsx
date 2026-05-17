import { ReactNode } from "react";
import { SlideShell } from "../components/SlideShell";
import { VideoPlayer } from "../components/VideoPlayer";

interface ToolSlideLayoutProps {
  category: string;
  categoryColor: string;
  toolName: string;
  problem: string | string[];
  solution: string | string[];
  highlights?: string[];
  icon: ReactNode;
  iconGradient: string;
  videoSrc?: string;
  videoKey?: string;
  videoCaption: string;
}

const FONT = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

function toBullets(input: string | string[]): string[] {
  if (Array.isArray(input)) return input.filter(Boolean);
  // Split a paragraph into ~3 sentence bullets
  return input
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ToolSlideLayout(p: ToolSlideLayoutProps) {
  const problemPoints = toBullets(p.problem);
  const solutionPoints = [...toBullets(p.solution), ...(p.highlights ?? [])];

  return (
    <SlideShell theme="dark">
      <div
        className="absolute inset-x-0 flex flex-col"
        style={{ top: 0, bottom: 52, fontFamily: FONT }}
      >
        {/* HEADER */}
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

        {/* PROBLEM / SOLUTION ROW */}
        <div className="grid grid-cols-2 gap-6 px-12 flex-shrink-0">
          <BulletCard
            heading="❌ THE PROBLEM"
            headingColor="#F87171"
            bg="rgba(248,113,113,0.06)"
            border="rgba(248,113,113,0.22)"
            bulletColor="#F87171"
            textColor="#CBD5E1"
            marker="•"
            points={problemPoints}
          />
          <BulletCard
            heading="✅ NEWTON'S SOLUTION"
            headingColor="#34D399"
            bg="rgba(52,211,153,0.07)"
            border="rgba(52,211,153,0.22)"
            bulletColor="#34D399"
            textColor="#F1F5F9"
            marker="✓"
            points={solutionPoints}
          />
        </div>

        {/* VIDEO BAND */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-12 pt-4 pb-4">
          <VideoPlayer
            src={p.videoSrc}
            toolKey={p.videoKey}
            toolName={p.toolName}
            toolIcon={p.icon}
            caption={p.videoCaption}
          />
        </div>
      </div>
    </SlideShell>
  );
}

function BulletCard({
  heading,
  headingColor,
  bg,
  border,
  bulletColor,
  textColor,
  marker,
  points,
}: {
  heading: string;
  headingColor: string;
  bg: string;
  border: string;
  bulletColor: string;
  textColor: string;
  marker: string;
  points: string[];
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.26em",
          color: headingColor,
          textTransform: "uppercase",
          marginBottom: 8,
          fontFamily: FONT,
        }}
      >
        {heading}
      </div>
      <ul className="space-y-1.5 m-0 p-0 list-none">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              style={{
                color: bulletColor,
                fontWeight: 800,
                fontSize: 13,
                lineHeight: 1.5,
                flexShrink: 0,
                width: 12,
              }}
            >
              {marker}
            </span>
            <span
              style={{
                color: textColor,
                fontSize: 12.5,
                lineHeight: 1.5,
                fontFamily: FONT,
                fontWeight: 400,
              }}
            >
              {pt}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}