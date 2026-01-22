import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageDashboard } from '@/components/UsageDashboard';
import { UsageTrendsChart } from '@/components/UsageTrendsChart';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp } from 'lucide-react';

export function UsageTab() {
  const { usage, subscription, loading } = useFeatureUsage();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
