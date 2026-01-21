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
        {/* Color-cycling glowing ring */}
        <motion.div 
          className="absolute inset-0 rounded-full blur-md"
          style={{ margin: -4 }}
          animate={{
            background: [
              "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))",
              "linear-gradient(180deg, hsl(var(--secondary)), hsl(280, 80%, 60%))",
              "linear-gradient(270deg, hsl(280, 80%, 60%), hsl(340, 80%, 60%))",
              "linear-gradient(360deg, hsl(340, 80%, 60%), hsl(var(--primary)))",
            ],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        {/* Logo container */}
        <div
          className="relative rounded-full overflow-hidden shadow-md border border-white/10 w-full h-full"
        >
          <img
            src={logoImage}
            alt="NewtonAI Logo"
            className="w-full h-full object-cover scale-125"
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
