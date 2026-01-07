import { Coins, Crown } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditBalanceProps {
  className?: string;
  showLabel?: boolean;
}

export function CreditBalance({ className, showLabel = false }: CreditBalanceProps) {
  const { credits, loading, isPremium } = useCredits();

  if (loading) {
    return <Skeleton className="h-8 w-16" />;
  }

  if (isPremium) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30",
              className
            )}>
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">Premium</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unlimited credits with Premium</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border",
            className
          )}>
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{credits}</span>
            {showLabel && <span className="text-xs text-muted-foreground">SC</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{credits} Study Credits available</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
