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
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div
        className={`flex-shrink-0 overflow-hidden aspect-square rounded-full ${margins} transition-transform duration-200 hover:scale-105`}
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
        <div className={`flex items-baseline gap-0 ${text}`}>
          <span className="font-display font-extrabold tracking-tight bg-gradient-to-r from-primary via-emerald-400 to-secondary bg-clip-text text-transparent">
            Newton
          </span>
          <span className="font-display font-black tracking-tighter bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent relative">
            AI
            <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-secondary rounded-full opacity-80" />
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
