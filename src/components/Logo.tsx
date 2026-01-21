import logoImage from "@/assets/logo.png";
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

const Logo = ({ size = "md", showText = true, className = "", animate = true }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: icon, height: icon }}
        animate={animate ? {
          scale: [1, 1.1, 1],
          rotate: [0, 360],
        } : undefined}
        transition={{
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
        }}
        whileHover={{ scale: 1.2 }}
      >
        <img
          src={logoImage}
          alt="NewtonAI Logo"
          className="w-full h-full object-cover"
        />
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
