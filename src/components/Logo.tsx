import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "default" | "minimal";
  className?: string;
}

const sizeMap = {
  xs: { icon: 20, text: "text-sm", padding: "p-1" },
  sm: { icon: 36, text: "text-lg", padding: "p-1.5" },
  md: { icon: 48, text: "text-2xl", padding: "p-1.5" },
  lg: { icon: 64, text: "text-3xl", padding: "p-1.5" },
};

const Logo = ({ size = "md", showText = true, variant = "default", className = "" }: LogoProps) => {
  const { icon, text, padding } = sizeMap[size];
  const containerSize = size === "xs" ? icon + 8 : icon + 12;

  // Minimal variant - just the icon without decorations
  if (variant === "minimal") {
    return (
      <Link to="/dashboard" className={`flex items-center justify-center ${className}`}>
        <img
          src={logoImage}
          alt="NewtonAI Logo"
          width={icon}
          height={icon}
          className="object-contain transition-transform duration-200 hover:scale-110"
        />
      </Link>
    );
  }

  return (
    <Link to="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`rounded-full bg-white ${padding} ring-2 ring-primary/20 shadow-md shadow-primary/10 overflow-hidden group`}
        style={{ width: containerSize, height: containerSize }}
      >
        <img
          src={logoImage}
          alt="NewtonAI Logo"
          width={icon}
          height={icon}
          className="object-contain transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      {showText && (
        <span className={`font-logo font-extrabold tracking-tight text-primary [filter:brightness(0.8)] ${text}`}>
          NewtonAI
        </span>
      )}
    </Link>
  );
};

export default Logo;
