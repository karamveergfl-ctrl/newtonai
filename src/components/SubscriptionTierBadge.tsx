import { cn } from "@/lib/utils";
import { Crown, Zap, User } from "lucide-react";

interface SubscriptionTierBadgeProps {
  tier: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export const SubscriptionTierBadge = ({ 
  tier, 
  size = "sm",
  showLabel = true 
}: SubscriptionTierBadgeProps) => {
  const normalizedTier = tier?.toLowerCase() || "free";
  
  const tierConfig = {
    free: {
      label: "Free Plan",
      shortLabel: "Free",
      icon: User,
      className: "bg-muted text-muted-foreground border-muted-foreground/20",
    },
    pro: {
      label: "Pro Plan",
      shortLabel: "Pro",
      icon: Zap,
      className: "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    },
    premium: {
      label: "Pro Plan",
      shortLabel: "Pro",
      icon: Zap,
      className: "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    },
    ultra: {
      label: "Ultra Plan",
      shortLabel: "Ultra",
      icon: Crown,
      className: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
  };

  const config = tierConfig[normalizedTier as keyof typeof tierConfig] || tierConfig.free;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        sizeClasses[size],
        config.className
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && (
        <span>{size === "sm" ? config.shortLabel : config.label}</span>
      )}
    </div>
  );
};
