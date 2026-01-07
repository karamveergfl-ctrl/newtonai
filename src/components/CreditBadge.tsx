import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  cost: number;
  className?: string;
  size?: "sm" | "md";
}

export function CreditBadge({ cost, className, size = "sm" }: CreditBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        className
      )}
    >
      <Coins className={cn("text-yellow-400", size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />
      <span>{cost}</span>
    </div>
  );
}
