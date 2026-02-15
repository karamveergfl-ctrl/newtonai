import newtonLogo from "@/assets/newton-logo.png";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
  compact?: boolean;
}

const sizeMap = {
  xs: { icon: 44, text: "text-lg" },
  sm: { icon: 80, text: "text-xl" },
  md: { icon: 120, text: "text-3xl" },
  lg: { icon: 180, text: "text-4xl" }
};

const Logo = ({ size = "md", showText = false, className = "", compact = false }: LogoProps) => {
  const { icon, text } = sizeMap[size];
  const margins = compact ? "-ml-1 -mr-0.5" : "-ml-4 -mr-3 -mt-2 -mb-2";

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