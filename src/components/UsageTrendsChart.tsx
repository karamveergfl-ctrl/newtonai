import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { FEATURE_LABELS } from "@/hooks/useFeatureUsage";
import { Loader2, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface DailyUsage {
  date: string;
  [key: string]: number | string;
}

interface FeatureTotal {
  name: string;
  label: string;
  icon: string;
  total: number;
  color: string;
}

const FEATURE_COLORS: Record<string, string> = {
  quiz: "hsl(var(--primary))",
  flashcards: "hsl(262, 83%, 58%)",
  mind_map: "hsl(199, 89%, 48%)",
  ai_podcast: "hsl(340, 82%, 52%)",
  summary: "hsl(142, 71%, 45%)",
  lecture_notes: "hsl(38, 92%, 50%)",
  homework_help: "hsl(280, 87%, 60%)",
  educational_videos: "hsl(173, 80%, 40%)",
};

export function UsageTrendsChart() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyUsage[]>([]);
  const [featureTotals, setFeatureTotals] = useState<FeatureTotal[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>("all");

  useEffect(() => {
    fetchUsageHistory();
  }, []);

  const fetchUsageHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get the last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    // Fetch all usage records for the past 30 days
    const { data: usageData, error } = await supabase
      .from("feature_usage")
      .select("*")
      .eq("user_id", session.user.id)
      .gte("period_start", format(startDate, "yyyy-MM-dd"))
      .order("period_start", { ascending: true });

    if (error) {
      console.error("Error fetching usage history:", error);
      setLoading(false);
      return;
    }

    // Generate all days in the interval
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Create a map for quick lookup
    const usageMap = new Map<string, Record<string, number>>();
    
    usageData?.forEach((record) => {
      const dateKey = record.period_start;
      if (!usageMap.has(dateKey)) {
        usageMap.set(dateKey, {});
      }
      const dayData = usageMap.get(dateKey)!;
      dayData[record.feature_name] = record.usage_count + (record.usage_minutes || 0);
    });

    // Build daily data array
    const chartData: DailyUsage[] = allDays.map((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayUsage = usageMap.get(dateKey) || {};
      
      return {
        date: format(day, "MMM d"),
        fullDate: dateKey,
        ...Object.keys(FEATURE_LABELS).reduce((acc, feature) => {
          acc[feature] = dayUsage[feature] || 0;
          return acc;
        }, {} as Record<string, number>),
      };
    });

    setDailyData(chartData);

    // Calculate totals per feature
    const totals: FeatureTotal[] = Object.entries(FEATURE_LABELS).map(([name, info]) => {
      const total = chartData.reduce((sum, day) => sum + (Number(day[name]) || 0), 0);
      return {
        name,
        label: info.label,
        icon: info.icon,
        total,
        color: FEATURE_COLORS[name] || "hsl(var(--muted-foreground))",
      };
    }).filter(f => f.total > 0).sort((a, b) => b.total - a.total);

    setFeatureTotals(totals);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasData = featureTotals.length > 0;

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Usage Trends
          <span className="text-xs font-normal text-muted-foreground ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Last 30 days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No usage data yet. Start using features to see trends!
          </div>
        ) : (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      {featureTotals.slice(0, 4).map((feature) => (
                        <linearGradient key={feature.name} id={`gradient-${feature.name}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={feature.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={feature.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    {featureTotals.slice(0, 4).map((feature) => (
                      <Area
                        key={feature.name}
                        type="monotone"
                        dataKey={feature.name}
                        name={feature.label}
                        stroke={feature.color}
                        fill={`url(#gradient-${feature.name})`}
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {featureTotals.slice(0, 4).map((feature) => (
                  <div key={feature.name} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: feature.color }}
                    />
                    <span className="text-muted-foreground">{feature.icon} {feature.label}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="mt-0">
              <div className="space-y-3">
                {featureTotals.map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{feature.icon}</span>
                      <span className="text-sm font-medium">{feature.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"
                      >
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((feature.total / Math.max(...featureTotals.map(f => f.total))) * 100, 100)}%`,
                            backgroundColor: feature.color
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold min-w-[32px] text-right">
                        {feature.total}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
