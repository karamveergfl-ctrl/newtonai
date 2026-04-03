import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { EngagementHeatmapItem } from "@/types/liveSession";

interface EngagementHeatmapProps {
  heatmapData: EngagementHeatmapItem[];
  totalSlides: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as EngagementHeatmapItem;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs space-y-0.5">
      <p className="font-semibold text-foreground">{d.slide_title || `Slide ${d.slide_index + 1}`}</p>
      <p>Score: <span className="font-medium">{Math.round(d.engagement_score)}/100</span></p>
      <p>👆 {d.pulse_responses} pulse · 📝 {d.annotations} notes · ❓ {d.questions_asked} questions</p>
    </div>
  );
}

export function EngagementHeatmap({ heatmapData, totalSlides }: EngagementHeatmapProps) {
  const allZero = heatmapData.every((d) => d.engagement_score === 0);

  if (allZero || heatmapData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">🔥 Engagement Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Not enough data to calculate engagement
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = heatmapData.map((d) => ({
    ...d,
    name: `S${d.slide_index + 1}`,
  }));

  // Find peak and lowest
  const peak = heatmapData.reduce((a, b) => (b.engagement_score > a.engagement_score ? b : a));
  const lowest = heatmapData.reduce((a, b) => (b.engagement_score < a.engagement_score ? b : a));
  const showAnnotations = heatmapData.length >= 3;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">🔥 Engagement Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="engagement_score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#engagementGradient)"
              />
              {showAnnotations && (
                <>
                  <ReferenceDot
                    x={`S${peak.slide_index + 1}`}
                    y={peak.engagement_score}
                    r={5}
                    fill="hsl(142, 76%, 36%)"
                    stroke="none"
                    label={{ value: "Peak", fontSize: 9, fill: "hsl(142, 76%, 36%)", position: "top" }}
                  />
                  {lowest.engagement_score < peak.engagement_score && (
                    <ReferenceDot
                      x={`S${lowest.slide_index + 1}`}
                      y={lowest.engagement_score}
                      r={5}
                      fill="hsl(0, 84%, 60%)"
                      stroke="none"
                      label={{ value: "Low", fontSize: 9, fill: "hsl(0, 84%, 60%)", position: "bottom" }}
                    />
                  )}
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Peak
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Confusion spike
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Based on pulse responses, annotations, and questions
        </p>
      </CardContent>
    </Card>
  );
}
