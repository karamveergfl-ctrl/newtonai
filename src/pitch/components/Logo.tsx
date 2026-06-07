import newtonLogo from "@/assets/newtonai-logo-n.png.asset.json";

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
        className="flex-shrink-0"
        style={{
          width: s.box,
          height: s.box,
          padding: 2,
          borderRadius: s.box * 0.22,
          background: "linear-gradient(135deg, #a855f7, #6366f1, #3b82f6)",
        }}
      >
        <div
          className="w-full h-full overflow-hidden bg-white"
          style={{ borderRadius: s.box * 0.22 - 2 }}
        >
          <img
            src={newtonLogo.url}
            alt="NewtonAI"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>
      {showWordmark && (
        <div style={{ fontWeight: 800, fontSize: s.font, lineHeight: 1, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#0F172A" }}>Newton</span>
          <span style={{ color: "#4338CA" }}>AI</span>
        </div>
      )}
    </div>
  );
}