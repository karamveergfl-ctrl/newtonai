import newtonLogo from "@/assets/newton-logo.png";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: { img: "h-14 w-14", text: "text-xl" },
  md: { img: "h-20 w-20", text: "text-3xl" },
  lg: { img: "h-28 w-28", text: "text-4xl" }
};

const Logo = ({ size = "md", showText = false, className = "" }: LogoProps) => {
  const { img, text } = sizeClasses[size];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <motion.div
        className="flex-shrink-0"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}>

        <img
          src={newtonLogo}
          alt="NewtonAI Logo"
          className={`${img} object-contain`} />

      </motion.div>
      {showText &&
      <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      }
    </div>);

};

export default Logo;