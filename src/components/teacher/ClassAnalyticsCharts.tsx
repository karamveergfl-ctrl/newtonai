import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClassAnalyticsChartsProps {
  analytics: any;
  assignmentResults?: any[];
}

const COLORS = ["hsl(var(--destructive))", "hsl(var(--chart-4, 45 93% 47%))", "hsl(var(--chart-3, 142 76% 36%))", "hsl(var(--primary))"];

export function ClassAnalyticsCharts({ analytics, assignmentResults }: ClassAnalyticsChartsProps) {
  const summaryData = [
    { name: "Students", value: analytics.enrollment_count || 0 },
    { name: "Assignments", value: analytics.assignment_count || 0 },
    { name: "Submissions", value: analytics.submission_count || 0 },
  ];

  // Completion rate donut
  const totalPossible = (analytics.enrollment_count || 0) * (analytics.assignment_count || 1);
  const completionPct = totalPossible > 0 ? Math.round(((analytics.submission_count || 0) / totalPossible) * 100) : 0;
  const donutData = [
    { name: "Completed", value: completionPct },
    { name: "Remaining", value: 100 - completionPct },
  ];

  // Score distribution across all assignments
  const scoreBuckets = [
    { name: "0-40", count: 0 },
    { name: "40-60", count: 0 },
    { name: "60-80", count: 0 },
    { name: "80-100", count: 0 },
  ];

  // Submission timeline
  const timelineData: Array<{ name: string; submissions: number }> = [];

  if (assignmentResults) {
    assignmentResults.forEach((a: any) => {
      (a.submissions || []).forEach((s: any) => {
        if (s.score == null) return;
        if (s.score < 40) scoreBuckets[0].count++;
        else if (s.score < 60) scoreBuckets[1].count++;
        else if (s.score < 80) scoreBuckets[2].count++;
        else scoreBuckets[3].count++;
      });

      timelineData.push({
        name: a.title?.slice(0, 10) || "—",
        submissions: a.submission_count || 0,
      });
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Class Overview Bar */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Class Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summaryData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Donut */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">{completionPct}%</p>
                <p className="text-[10px] text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      {scoreBuckets.some((b) => b.count > 0) && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreBuckets}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreBuckets.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Submission Timeline */}
      {timelineData.length > 1 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submissions by Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
