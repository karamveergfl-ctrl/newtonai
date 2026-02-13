import newtonLogo from "@/assets/newton-logo.png";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: { icon: 120, text: "text-xl" },
  md: { icon: 160, text: "text-3xl" },
  lg: { icon: 220, text: "text-4xl" }
};

const Logo = ({ size = "md", showText = false, className = "" }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <motion.div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: icon, height: icon }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}>

        <img
          src={newtonLogo}
          alt="NewtonAI Logo"
          className="w-[160%] h-[160%] object-contain -m-[30%]" />

      </motion.div>
      {showText &&
      <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      }
    </div>);

};

export default Logo;