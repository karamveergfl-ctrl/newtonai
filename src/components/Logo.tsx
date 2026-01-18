import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 36, text: "text-lg" },
  md: { icon: 48, text: "text-2xl" },
  lg: { icon: 64, text: "text-3xl" },
};

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div 
        className="rounded-full bg-white p-1.5 ring-2 ring-primary/20 shadow-md shadow-primary/10 overflow-hidden group"
        style={{ width: icon + 12, height: icon + 12 }}
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
        <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      )}
    </Link>
  );
};

export default Logo;
