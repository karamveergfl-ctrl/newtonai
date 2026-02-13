import newtonLogo from "@/assets/newton-logo.png";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: { icon: 36, text: "text-lg" },
  md: { icon: 52, text: "text-2xl" },
  lg: { icon: 72, text: "text-3xl" }
};

const Logo = ({ size = "md", showText = false, className = "" }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="flex-shrink-0"
        style={{ width: icon, height: icon }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}>

        <img
          src={newtonLogo}
          alt="NewtonAI Logo"
          className="w-full h-full object-contain shadow-md" />

      </motion.div>
      {showText &&
      <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      }
    </div>);

};

export default Logo;