import { motion } from "framer-motion";

interface GradientBlobProps {
  className?: string;
  color?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
  delay?: number;
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-64 h-64",
  lg: "w-96 h-96",
  xl: "w-[500px] h-[500px]",
};

const colorClasses = {
  primary: "bg-primary/30",
  secondary: "bg-secondary/30",
  accent: "bg-accent/30",
};

export const GradientBlob = ({
  className = "",
  color = "primary",
  size = "md",
  delay = 0,
}: GradientBlobProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay }}
      className={`absolute rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
};

export default GradientBlob;
