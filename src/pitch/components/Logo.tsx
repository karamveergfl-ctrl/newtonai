import { PITCH_COLORS } from "../constants/videoPaths";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
}

const SIZES = {
  sm: { box: 28, font: 16, sub: 13 },
  md: { box: 40, font: 22, sub: 18 },
  lg: { box: 64, font: 34, sub: 28 },
  xl: { box: 96, font: 52, sub: 42 },
};

export function Logo({ size = "md", showWordmark = true }: LogoProps) {
  const s = SIZES[size];
  return (
    <div className="flex items-center gap-3 select-none">
      <div
        style={{
          width: s.box,
          height: s.box,
          borderRadius: s.box * 0.28,
          background: `linear-gradient(135deg, ${PITCH_COLORS.primary}, #312E81)`,
          boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
        }}
        className="relative flex items-center justify-center"
      >
        <svg viewBox="0 0 32 32" width={s.box * 0.62} height={s.box * 0.62}>
          <line x1="7" y1="6" x2="7" y2="26" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="6" x2="25" y2="26" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="7" y1="6" x2="25" y2="26" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.6" fill={PITCH_COLORS.accent} />
        </svg>
      </div>
      {showWordmark && (
        <div style={{ fontWeight: 800, fontSize: s.font, lineHeight: 1, letterSpacing: "-0.02em" }}>
          <span style={{ color: "white" }}>Newton</span>
          <span style={{ color: "#A5B4FC", marginLeft: 4, fontSize: s.sub }}>AI</span>
        </div>
      )}
    </div>
  );
}