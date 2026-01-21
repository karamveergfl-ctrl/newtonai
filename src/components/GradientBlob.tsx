import { memo } from "react";

interface GradientBlobProps {
  className?: string;
  color?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
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

export const GradientBlob = memo(({
  className = "",
  color = "primary",
  size = "md",
}: GradientBlobProps) => {
  return (
    <div
      className={`absolute rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob-slow motion-reduce:animate-none gpu-accelerated ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      aria-hidden="true"
    />
  );
});

GradientBlob.displayName = "GradientBlob";

export default GradientBlob;
