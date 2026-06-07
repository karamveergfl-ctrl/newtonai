import newtonLogoN from "@/assets/newtonai-logo-n.png.asset.json";

const LOGO_SRC = newtonLogoN.url;

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
  compact?: boolean;
  eager?: boolean;
}

const sizeMap = {
  xs: { icon: 32, text: "text-lg" },
  sm: { icon: 36, text: "text-lg" },
  md: { icon: 160, text: "text-2xl" },
  lg: { icon: 220, text: "text-3xl" }
};

const Logo = ({ size = "md", showText = false, className = "", compact = false, eager = true }: LogoProps) => {
  const { icon, text } = sizeMap[size];
  const margins = compact ? "ml-0" : "-ml-2 -mr-1";

  const radius = Math.round(icon * 0.22);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-shrink-0 ${margins} transition-transform duration-200 hover:scale-105`}
        style={{
          width: icon,
          height: icon,
          padding: 2,
          borderRadius: radius,
          background: "linear-gradient(135deg, #a855f7, #6366f1, #3b82f6)",
        }}
      >
        <div
          className="overflow-hidden w-full h-full bg-background"
          style={{ borderRadius: radius - 2 }}
        >
          <img
            src={LOGO_SRC}
            alt="NewtonAI Logo"
            loading={eager ? "eager" : "lazy"}
            decoding="sync"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      {showText && (
        <span className={`font-display font-extrabold tracking-tight bg-gradient-to-r from-primary via-emerald-400 to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      )}
    </div>
  );
};

export default Logo;
