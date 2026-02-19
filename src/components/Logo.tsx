import newtonLogo from "@/assets/newton-logo-clean.png";

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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-shrink-0 overflow-hidden aspect-square rounded-full ${margins} ring-2 ring-primary/30 transition-transform duration-200 hover:scale-105`}
        style={{ width: icon, height: icon }}>
        <img
          src={newtonLogo}
          alt="NewtonAI Logo"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="w-full h-full object-contain"
          style={{ imageRendering: 'auto' }} />
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
