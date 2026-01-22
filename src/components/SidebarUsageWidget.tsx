import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeatureUsage, FeatureLimit } from "@/hooks/useFeatureUsage";
import { cn } from "@/lib/utils";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface SidebarUsageWidgetProps {
  isCollapsed?: boolean;
}

export function SidebarUsageWidget({ isCollapsed = false }: SidebarUsageWidgetProps) {
  const { usage, subscription, loading } = useFeatureUsage();

  if (loading) return null;

  // Get top features to display (prioritize near-limit ones)
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  // Filter to limited features and sort by usage percentage (highest first)
  const limitedFeatures = usage
    .filter(f => f.limit !== -1)
    .sort((a, b) => 
      getUsagePercentage(b.used, b.limit) - getUsagePercentage(a.used, a.limit)
    )
    .slice(0, 4);

  const nearLimitCount = limitedFeatures.filter(f => 
    getUsagePercentage(f.used, f.limit) >= 70
  ).length;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "[&>div]:bg-destructive";
    if (percentage >= 70) return "[&>div]:bg-yellow-500";
    return "";
  };

  // Collapsed view - just show icon with tooltip
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "flex items-center justify-center p-2 rounded-lg cursor-default",
              nearLimitCount > 0 ? "bg-yellow-500/10" : "bg-muted/30"
            )}
          >
            {nearLimitCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium text-sm">Usage Summary</p>
            {limitedFeatures.map(f => (
              <div key={f.name} className="flex items-center justify-between text-xs">
                <span>{f.icon} {f.label}</span>
                <span className={getStatusColor(getUsagePercentage(f.used, f.limit))}>
                  {f.used}/{f.limit}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-3 py-2"
    >
      {nearLimitCount > 0 && (
        <div className="flex items-center justify-end mb-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-yellow-500 border-yellow-500/30">
            {nearLimitCount} near limit
          </Badge>
        </div>
      )}
      
      <div className="space-y-2">
        {limitedFeatures.map((feature, index) => {
          const percentage = getUsagePercentage(feature.used, feature.limit);
          const remaining = feature.limit - feature.used;
          
          return (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="text-sm">{feature.icon}</span>
                  <span className="truncate max-w-[80px]">{feature.label}</span>
                </span>
                <span className={cn("font-medium", getStatusColor(percentage))}>
                  {remaining > 0 ? (
                    <>{remaining} left</>
                  ) : (
                    <span className="text-destructive">Full</span>
                  )}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={cn("h-1", getProgressColor(percentage))}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Ultra badge for unlimited users */}
      {subscription.tier === "ultra" && (
        <div className="mt-2 text-center">
          <Badge className="text-[10px] bg-gradient-to-r from-primary to-secondary">
            ✨ Unlimited Access
          </Badge>
        </div>
      )}
    </motion.div>
  );
}
