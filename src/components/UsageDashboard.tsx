import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, TrendingUp, Calendar, Zap } from "lucide-react";
import { FeatureLimit, SubscriptionInfo } from "@/hooks/useFeatureUsage";
import { cn } from "@/lib/utils";

interface UsageDashboardProps {
  usage: FeatureLimit[];
  subscription: SubscriptionInfo;
}

export function UsageDashboard({ usage, subscription }: UsageDashboardProps) {
  const navigate = useNavigate();

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-yellow-500";
    return "text-primary";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "";
  };

  const formatLimit = (limit: number, unit: string) => {
    if (limit === -1) return "∞";
    return limit.toString();
  };

  const formatPeriod = (unit: string) => {
    if (unit === "per_day") return "today";
    if (unit === "minutes_per_month") return "min/month";
    return "this month";
  };

  // Separate daily and monthly features
  const dailyFeatures = usage.filter(f => f.unit === "per_day");
  const monthlyFeatures = usage.filter(f => f.unit !== "per_day");

  // Calculate overall usage stats
  const limitedFeatures = usage.filter(f => f.limit !== -1);
  const nearLimitCount = limitedFeatures.filter(f => 
    getUsagePercentage(f.used, f.limit) >= 70
  ).length;

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Usage Dashboard
          </CardTitle>
          <Badge variant={subscription.tier === "free" ? "secondary" : "default"} className="capitalize">
            {subscription.tier === "free" ? "Free Plan" : `${subscription.tier} Plan`}
          </Badge>
        </div>
        {subscription.tier === "free" && nearLimitCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {nearLimitCount} feature{nearLimitCount > 1 ? "s" : ""} near limit
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Features Section */}
        {dailyFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Daily Limits
              </span>
            </div>
            <div className="grid gap-2">
              {dailyFeatures.map((feature, index) => {
                const percentage = getUsagePercentage(feature.used, feature.limit);
                return (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <span className="text-lg shrink-0">{feature.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{feature.label}</span>
                        <span className={cn("text-xs font-medium", getUsageColor(percentage))}>
                          {feature.limit === -1 ? (
                            <span className="text-primary">Unlimited</span>
                          ) : (
                            `${feature.used}/${formatLimit(feature.limit, feature.unit)}`
                          )}
                        </span>
                      </div>
                      {feature.limit !== -1 && (
                        <Progress 
                          value={percentage} 
                          className={cn("h-1.5", getProgressColor(percentage))}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly Features Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Monthly Limits
            </span>
          </div>
          <div className="grid gap-2">
            {monthlyFeatures.map((feature, index) => {
              const percentage = getUsagePercentage(feature.used, feature.limit);
              return (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (dailyFeatures.length + index) * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <span className="text-lg shrink-0">{feature.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{feature.label}</span>
                      <span className={cn("text-xs font-medium", getUsageColor(percentage))}>
                        {feature.limit === -1 ? (
                          <span className="text-primary">Unlimited</span>
                        ) : (
                          <>
                            {feature.used}/{formatLimit(feature.limit, feature.unit)}
                            {feature.unit === "minutes_per_month" && <span className="text-muted-foreground ml-0.5">min</span>}
                          </>
                        )}
                      </span>
                    </div>
                    {feature.limit !== -1 && (
                      <Progress 
                        value={percentage} 
                        className={cn("h-1.5", getProgressColor(percentage))}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {subscription.tier === "free" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              onClick={() => navigate("/pricing")}
              className="w-full gap-2 bg-gradient-to-r from-primary to-secondary"
            >
              <Crown className="h-4 w-4" />
              Upgrade for Higher Limits
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
