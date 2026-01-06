import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FloatingBadgeProps {
  icon?: LucideIcon;
  label: string;
  className?: string;
  delay?: number;
  avatarUrl?: string;
}

export const FloatingBadge = ({
  icon: Icon,
  label,
  className = "",
  delay = 0,
  avatarUrl,
}: FloatingBadgeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 100,
      }}
      className={`absolute glass rounded-full px-4 py-2 flex items-center gap-2 shadow-lg ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
        />
      ) : Icon ? (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      ) : null}
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {label}
      </span>
    </motion.div>
  );
};

export default FloatingBadge;
