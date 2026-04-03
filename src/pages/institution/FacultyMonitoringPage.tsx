import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { InstitutionFeatureGate } from "@/components/institution/InstitutionFeatureGate";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, BookOpen, Calendar, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface CourseAllocation {
  course_name: string;
  course_code: string | null;
  class_count: number;
}

interface FacultyWorkload {
  teacher_id: string;
  teacher_name: string;
  avatar_url: string | null;
  active_class_count: number;
  course_count: number;
  courses: CourseAllocation[];
  total_sessions: number;
  sessions_this_week: number;
  sessions_this_month: number;
  total_students: number;
  assignment_count: number;
  avg_student_score: number;
  last_active: string | null;
}

function FacultyContent() {
  const { institution, loading } = useInstitution();
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

  const { data: facultyData, isLoading } = useQuery({
    queryKey: ["faculty-workload", institution?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_faculty_workload", {
        p_institution_id: institution!.id,
      });
      if (error) throw error;
      return (data as unknown as FacultyWorkload[]) || [];
    },
    enabled: !!institution?.id,
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getEngagementColor = (sessions: number) => {
    if (sessions >= 10) return "bg-green-500";
    if (sessions >= 3) return "bg-amber-500";
    return "bg-destructive";
  };

  const getWorkloadLevel = (sessionsMonth: number) => {
    if (sessionsMonth >= 15) return { label: "High", color: "text-destructive" };
    if (sessionsMonth >= 5) return { label: "Normal", color: "text-green-500" };
    return { label: "Low", color: "text-amber-500" };
  };

  const totalFaculty = facultyData?.length ?? 0;
  const activeFaculty = facultyData?.filter((f) => f.total_sessions > 0).length ?? 0;
  const totalStudents = facultyData?.reduce((s, f) => s + f.total_students, 0) ?? 0;
  const avgSessionsMonth = totalFaculty
    ? Math.round((facultyData?.reduce((s, f) => s + f.sessions_this_month, 0) ?? 0) / totalFaculty)
    : 0;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold">Faculty Monitoring</h1>
        <p className="text-sm text-muted-foreground">{institution?.name} · Teacher Engagement & Workload</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalFaculty}</p>
            <p className="text-xs text-muted-foreground">Total Faculty</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{activeFaculty}</p>
            <p className="text-xs text-muted-foreground">Active (sessions &gt; 0)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <GraduationCap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{avgSessionsMonth}</p>
            <p className="text-xs text-muted-foreground">Avg Sessions/Month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Course Allocation</TabsTrigger>
          <TabsTrigger value="workload">Workload Tracker</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Faculty Overview ({totalFaculty})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {facultyData && facultyData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">Status</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-center">Classes</TableHead>
                      <TableHead className="text-center">Sessions</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-center">Avg Score</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facultyData.map((f) => (
                      <TableRow key={f.teacher_id}>
                        <TableCell>
                          <div className={`h-3 w-3 rounded-full ${getEngagementColor(f.total_sessions)}`} />
                        </TableCell>
                        <TableCell className="font-medium">{f.teacher_name || "Unknown"}</TableCell>
                        <TableCell className="text-center">{f.active_class_count}</TableCell>
                        <TableCell className="text-center">{f.total_sessions}</TableCell>
                        <TableCell className="text-center">{f.total_students}</TableCell>
                        <TableCell className="text-center">{f.avg_student_score}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {f.last_active ? format(new Date(f.last_active), "MMM d, yyyy") : "Never"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No faculty data available</p>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-green-500" /> 10+ sessions</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-amber-500" /> 3–9 sessions</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-destructive" /> &lt;3 sessions</div>
          </div>
        </TabsContent>

        {/* Course Allocation Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Allocation by Faculty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {facultyData && facultyData.length > 0 ? (
                facultyData.map((f) => {
                  const isExpanded = expandedTeacher === f.teacher_id;
                  return (
                    <div key={f.teacher_id} className="border border-border rounded-lg">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedTeacher(isExpanded ? null : f.teacher_id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {(f.teacher_name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{f.teacher_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.course_count} course{f.course_count !== 1 ? "s" : ""} · {f.active_class_count} active class{f.active_class_count !== 1 ? "es" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{f.total_students} students</Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border">
                          {f.courses.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Course</TableHead>
                                  <TableHead>Code</TableHead>
                                  <TableHead className="text-center">Active Classes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {f.courses.map((c, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">{c.course_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{c.course_code || "—"}</TableCell>
                                    <TableCell className="text-center">{c.class_count}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-sm text-muted-foreground py-3 text-center">No courses assigned</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">No faculty data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload Tracker Tab */}
        <TabsContent value="workload">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly & Monthly Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              {facultyData && facultyData.length > 0 ? (
                <div className="space-y-4">
                  {facultyData.map((f) => {
                    const workload = getWorkloadLevel(f.sessions_this_month);
                    const monthlyPercent = Math.min((f.sessions_this_month / 20) * 100, 100);
                    return (
                      <div key={f.teacher_id} className="flex items-center gap-4">
                        <div className="w-36 shrink-0">
                          <p className="text-sm font-medium truncate">{f.teacher_name || "Unknown"}</p>
                          <p className={`text-xs font-medium ${workload.color}`}>{workload.label} workload</p>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{f.sessions_this_week} this week</span>
                            <span>{f.sessions_this_month} this month</span>
                          </div>
                          <Progress value={monthlyPercent} className="h-2" />
                        </div>
                        <div className="text-right shrink-0 w-20">
                          <p className="text-sm font-medium">{f.assignment_count}</p>
                          <p className="text-xs text-muted-foreground">assignments</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No workload data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FacultyMonitoringPage() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <div className="flex-1">
            <InstitutionFeatureGate feature="faculty_monitoring">
              <FacultyContent />
            </InstitutionFeatureGate>
          </div>
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
