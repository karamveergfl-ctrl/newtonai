import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { cn } from "@/lib/utils";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface UsageSummaryBadgeProps {
  onNavigateToUsage?: () => void;
}

export function UsageSummaryBadge({ onNavigateToUsage }: UsageSummaryBadgeProps) {
  const { usage, subscription, loading } = useFeatureUsage();
  const [, setSearchParams] = useSearchParams();

  if (loading) return null;

  // Ultra users have unlimited access
  if (subscription.tier === "ultra") return null;

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  // Filter to limited features
  const limitedFeatures = usage.filter(f => f.limit !== -1);
  
  const nearLimitCount = limitedFeatures.filter(f => 
    getUsagePercentage(f.used, f.limit) >= 70
  ).length;

  const criticalCount = limitedFeatures.filter(f => 
    getUsagePercentage(f.used, f.limit) >= 90
  ).length;

  const handleClick = () => {
    if (onNavigateToUsage) {
      onNavigateToUsage();
    } else {
      setSearchParams({ tab: "usage" });
    }
  };

  // Determine status and styling
  let statusIcon = <CheckCircle className="h-3 w-3" />;
  let statusText = "All good";
  let badgeClass = "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20";

  if (criticalCount > 0) {
    statusIcon = <AlertTriangle className="h-3 w-3" />;
    statusText = `${criticalCount} at limit`;
    badgeClass = "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20";
  } else if (nearLimitCount > 0) {
    statusIcon = <TrendingUp className="h-3 w-3" />;
    statusText = `${nearLimitCount} near limit`;
    badgeClass = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-colors gap-1",
              badgeClass
            )}
            onClick={handleClick}
          >
            {statusIcon}
            <span className="text-[10px]">{statusText}</span>
          </Badge>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <div className="space-y-1">
          <p className="font-medium text-sm">Usage Summary</p>
          {limitedFeatures.slice(0, 4).map(f => {
            const percent = getUsagePercentage(f.used, f.limit);
            return (
              <div key={f.name} className="flex items-center justify-between text-xs gap-3">
                <span className="flex items-center gap-1">
                  <span>{f.icon}</span>
                  <span className="truncate">{f.label}</span>
                </span>
                <span className={cn(
                  "font-medium",
                  percent >= 90 ? "text-destructive" : 
                  percent >= 70 ? "text-yellow-500" : 
                  "text-muted-foreground"
                )}>
                  {f.used}/{f.limit}
                </span>
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground pt-1">Click to view details</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
