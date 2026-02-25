import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, TrendingUp, GraduationCap, BookOpen, Brain } from "lucide-react";
import { InstitutionAIInsights } from "@/components/institution/InstitutionAIInsights";
import { InstitutionFeatureGate } from "@/components/institution/InstitutionFeatureGate";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function AnalyticsContent() {
  const { institution, loading } = useInstitution();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["institution-analytics", institution?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_institution_analytics", {
        p_institution_id: institution!.id,
      });
      if (error) throw error;
      return data as any;
    },
    enabled: !!institution?.id,
  });

  const { data: facultyStats, isLoading: facultyLoading } = useQuery({
    queryKey: ["faculty-stats", institution?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_faculty_stats", {
        p_institution_id: institution!.id,
      });
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!institution?.id,
  });

  if (loading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">No institution found.</p>
      </div>
    );
  }

  const kpiCards = [
    { title: "Total Students", value: analytics?.total_students ?? 0, icon: Users, color: "text-blue-500" },
    { title: "Avg Score", value: analytics?.avg_score ?? 0, icon: TrendingUp, color: "text-green-500" },
    { title: "Attendance Rate", value: `${analytics?.attendance_rate ?? 0}%`, icon: GraduationCap, color: "text-amber-500" },
    { title: "Active Courses", value: analytics?.active_courses ?? 0, icon: BookOpen, color: "text-purple-500" },
  ];

  const courseStats = analytics?.course_stats || [];
  const attendanceStats = analytics?.attendance_stats || [];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold">Institution Analytics</h1>
        <p className="text-sm text-muted-foreground">{institution.name} · Performance Overview</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="ai-insights" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Course Performance</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {courseStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="course_name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="avg_score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Pass/Fail Rates by Course</CardTitle></CardHeader>
            <CardContent>
              {courseStats.length > 0 ? (
                <div className="space-y-3">
                  {courseStats.map((cs: any) => {
                    const total = (cs.pass_count || 0) + (cs.fail_count || 0);
                    const passRate = total > 0 ? Math.round((cs.pass_count / total) * 100) : 0;
                    return (
                      <div key={cs.course_name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cs.course_name} {cs.course_code && `(${cs.course_code})`}</span>
                          <span className="text-muted-foreground">{passRate}% pass · Avg: {cs.avg_score}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${passRate}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No marks data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Attendance by Class</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              {attendanceStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} className="fill-muted-foreground" />
                    <YAxis dataKey="class_name" type="category" width={120} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="attendance_rate" radius={[0, 4, 4, 0]}>
                      {attendanceStats.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.attendance_rate < 60 ? "hsl(var(--destructive))" : entry.attendance_rate < 80 ? "hsl(38 92% 50%)" : "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No attendance data</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Faculty Engagement</CardTitle></CardHeader>
            <CardContent>
              {facultyLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (facultyStats && facultyStats.length > 0) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-center">Classes</TableHead>
                      <TableHead className="text-center">Sessions</TableHead>
                      <TableHead className="text-center">Assignments</TableHead>
                      <TableHead className="text-center">Avg Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facultyStats.map((f: any) => (
                      <TableRow key={f.teacher_id}>
                        <TableCell className="font-medium">{f.teacher_name || "Unknown"}</TableCell>
                        <TableCell className="text-center">{f.class_count}</TableCell>
                        <TableCell className="text-center">{f.session_count}</TableCell>
                        <TableCell className="text-center">{f.assignment_count}</TableCell>
                        <TableCell className="text-center">{f.avg_student_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No faculty data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          <InstitutionFeatureGate feature="ai_insights" overlay>
            <InstitutionAIInsights analytics={analytics} facultyStats={facultyStats || []} />
          </InstitutionFeatureGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function InstitutionAnalyticsPage() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <AnalyticsContent />
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
