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
  const problemPoints = toBullets(p.problem).slice(0, 3);
  const solutionPoints = [...toBullets(p.solution), ...(p.highlights ?? [])].slice(0, 4);

  return (
    <SlideShell theme="light">
      <div
        className="absolute inset-x-0 flex flex-col"
        style={{ top: 0, bottom: 64, fontFamily: FONT }}
      >
        {/* HEADER (sits below the top-left Logo) */}
        <div className="flex items-center justify-between gap-6 px-14 pt-28 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div
              className="inline-flex items-center px-3 py-1.5 rounded-full mb-3"
              style={{
                background: `${p.categoryColor}15`,
                color: p.categoryColor,
                border: `1px solid ${p.categoryColor}40`,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              {p.category}
            </div>
            <h1
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 34,
                color: "#0F172A",
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
                margin: "6px 0 0 0",
              }}
            >
              {p.toolName}
            </h1>
          </div>
          <div
            className="rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              width: 96,
              height: 96,
              background: p.iconGradient,
              boxShadow: `0 14px 36px ${p.categoryColor}55`,
            }}
          >
            <div style={{ transform: "scale(0.95)" }}>{p.icon}</div>
          </div>
        </div>

        {/* PROBLEM / SOLUTION ROW */}
        <div className="grid grid-cols-2 gap-5 px-14 pb-6 flex-shrink-0 items-stretch">
          <BulletCard
            heading="❌ THE PROBLEM"
            headingColor="#DC2626"
            bg="rgba(254,226,226,0.7)"
            border="rgba(220,38,38,0.25)"
            bulletColor="#DC2626"
            textColor="#475569"
            marker="•"
            points={problemPoints}
          />
          <BulletCard
            heading="✅ NEWTON'S SOLUTION"
            headingColor="#059669"
            bg="rgba(220,252,231,0.7)"
            border="rgba(5,150,105,0.25)"
            bulletColor="#059669"
            textColor="#0F172A"
            marker="✓"
            points={solutionPoints}
          />
        </div>

        {/* VIDEO BAND */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-14 pt-2 pb-3 overflow-hidden">
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
      className="rounded-2xl p-5 backdrop-blur-sm"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.26em",
          color: headingColor,
          textTransform: "uppercase",
          marginBottom: 10,
          fontFamily: FONT,
        }}
      >
        {heading}
      </div>
      <ul className="space-y-2 m-0 p-0 list-none">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              style={{
                color: bulletColor,
                fontWeight: 800,
                fontSize: 16,
                lineHeight: 1.5,
                flexShrink: 0,
                width: 14,
              }}
            >
              {marker}
            </span>
            <span
              style={{
                color: textColor,
                fontSize: 15,
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