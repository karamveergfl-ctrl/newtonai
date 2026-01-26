import newtonLogo from "@/assets/newton-logo.png";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: { icon: 32, text: "text-lg" },
  md: { icon: 48, text: "text-2xl" },
  lg: { icon: 64, text: "text-3xl" },
};

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: icon, height: icon }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {/* Static glowing ring - constant primary color */}
        <div 
          className="absolute inset-0 rounded-xl blur-md opacity-70"
          style={{ 
            margin: -4,
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))"
          }}
        />
        {/* Logo container */}
        <div
          className="relative rounded-xl overflow-hidden shadow-md w-full h-full"
        >
          <img
            src={newtonLogo}
            alt="NewtonAI Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      )}
    </div>
  );
};

export default Logo;
