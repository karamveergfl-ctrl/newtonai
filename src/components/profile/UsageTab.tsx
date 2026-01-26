import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UsageDashboard } from '@/components/UsageDashboard';
import { UsageTrendsChart } from '@/components/UsageTrendsChart';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function UsageTab() {
  const { usage, subscription, loading } = useFeatureUsage();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const limitedFeatures = usage.filter(f => f.limit !== -1);
  const nearLimitCount = limitedFeatures.filter(f => getUsagePercentage(f.used, f.limit) >= 70).length;
  const criticalCount = limitedFeatures.filter(f => getUsagePercentage(f.used, f.limit) >= 90).length;
  const totalUsed = limitedFeatures.reduce((acc, f) => acc + f.used, 0);

  const tier = subscription.tier?.toLowerCase();
  const tierLabel = tier === 'ultra' ? 'Ultra' : 
                    tier === 'pro' || tier === 'premium' ? 'Pro' : 'Free';
  const tierColor = tier === 'ultra' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                    tier === 'pro' || tier === 'premium' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                    'bg-secondary';
  const isFree = tier === 'free' || !tier;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Total Used */}
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{totalUsed}</p>
                <p className="text-xs text-muted-foreground">Used this month</p>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                {criticalCount > 0 ? (
                  <>
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-destructive">{criticalCount} at limit</p>
                      <p className="text-xs text-muted-foreground">Upgrade for more</p>
                    </div>
                  </>
                ) : nearLimitCount > 0 ? (
                  <>
                    <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-600">{nearLimitCount} near limit</p>
                      <p className="text-xs text-muted-foreground">Consider upgrading</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">All good</p>
                      <p className="text-xs text-muted-foreground">Within limits</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Plan Badge + CTA */}
            <div className="flex items-center gap-3">
              <Badge className={cn("text-white border-0", tierColor)}>
                {tierLabel} Plan
              </Badge>
              {isFree && (
                <Button size="sm" onClick={() => navigate('/pricing')} className="gap-1">
                  <Zap className="h-3 w-3" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Dashboard */}
      <UsageDashboard usage={usage} subscription={subscription} />
      
      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Usage Trends
          </CardTitle>
          <CardDescription>Your activity over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageTrendsChart />
        </CardContent>
      </Card>
    </div>
  );
}
