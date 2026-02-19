import newtonLogo from "@/assets/newton-logo-sm.webp";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
  compact?: boolean;
}

const sizeMap = {
  xs: { icon: 60, text: "text-lg" },
  sm: { icon: 72, text: "text-xl" },
  md: { icon: 160, text: "text-3xl" },
  lg: { icon: 220, text: "text-4xl" }
};

const Logo = ({ size = "md", showText = false, className = "", compact = false }: LogoProps) => {
  const { icon, text } = sizeMap[size];
  const margins = compact ? "-ml-3 -mr-1.5 -mt-1 -mb-1" : "-ml-6 -mr-5 -mt-4 -mb-4";

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <motion.div
        className={`flex-shrink-0 overflow-hidden aspect-square rounded-lg ${margins}`}
        style={{ width: icon, height: icon }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}>

        <img
          src={newtonLogo}
          alt="NewtonAI Logo"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="w-full h-full object-contain"
          style={{ imageRendering: 'auto' }} />

      </motion.div>
      {showText &&
      <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      }
    </div>);

};

export default Logo;