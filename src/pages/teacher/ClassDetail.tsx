import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { InviteCodePill } from "@/components/teacher/InviteCodePill";
import { ClassAnalyticsCharts } from "@/components/teacher/ClassAnalyticsCharts";
import { StudentProgressTable } from "@/components/teacher/StudentProgressTable";
import { AssignmentResultsPanel } from "@/components/teacher/AssignmentResultsPanel";
import { AttendanceGrid } from "@/components/teacher/AttendanceGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, FileText, ClipboardList, BarChart3, MoreHorizontal, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClassInfo {
  id: string;
  name: string;
  subject: string | null;
  description: string | null;
  invite_code: string;
  academic_year: string | null;
}

interface Enrollment {
  id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  profile?: { full_name: string | null };
}

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingClass, setLoadingClass] = useState(true);
  const { assignments, loading: loadingAssignments } = useAssignments(id);

  useEffect(() => {
    if (!id) return;
    const fetchClass = async () => {
      const { data } = await supabase.from("classes").select("*").eq("id", id).single();
      setClassInfo(data);
      setLoadingClass(false);
    };

    const fetchEnrollments = async () => {
      const { data } = await supabase
        .from("class_enrollments")
        .select("*")
        .eq("class_id", id)
        .eq("status", "active");

      if (data) {
        const enriched = await Promise.all(
          data.map(async (e) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", e.student_id)
              .maybeSingle();
            return { ...e, profile };
          })
        );
        setEnrollments(enriched);
      }
    };

    fetchClass();
    fetchEnrollments();
  }, [id]);

  const removeStudent = async (enrollmentId: string) => {
    const { error } = await supabase
      .from("class_enrollments")
      .update({ status: "removed" })
      .eq("id", enrollmentId);
    if (error) {
      toast.error("Failed to remove student");
    } else {
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      toast.success("Student removed");
    }
  };

  const shareInvite = () => {
    const link = `${window.location.origin}/join-class?code=${classInfo?.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  if (loadingClass) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!classInfo) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Class not found</h1>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title={classInfo.name} description="Manage your class" noIndex />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Sticky Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="shrink-0 self-start">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold truncate">{classInfo.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {classInfo.subject && <Badge variant="secondary" className="text-xs">{classInfo.subject}</Badge>}
              {classInfo.academic_year && <Badge variant="outline" className="text-xs">{classInfo.academic_year}</Badge>}
              <InviteCodePill code={classInfo.invite_code} />
            </div>
          </div>
        </motion.div>

        {classInfo.description && (
          <p className="text-muted-foreground text-sm mb-6">{classInfo.description}</p>
        )}

        <Tabs defaultValue="students">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="students" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span> ({enrollments.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span> ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-5">
            {enrollments.length === 0 ? (
              <Card className="text-center py-12 border-border/50">
                <CardContent>
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No students enrolled yet. Share the invite code!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {enrollments.map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="border-border/50">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar initials */}
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {(e.profile?.full_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{e.profile?.full_name || "Unknown Student"}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(e.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => removeStudent(e.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              Remove Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-5">
            {loadingAssignments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <Card className="text-center py-12 border-border/50">
                <CardContent>
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {assignments.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="border-border/50">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.is_published ? "bg-green-500" : "bg-amber-400"}`} />
                          <div>
                            <p className="font-medium text-sm">{a.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] h-5">{a.assignment_type}</Badge>
                              {a.is_published ? (
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Published</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-medium">Draft</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {a.due_date && (
                          <DueDateBadge dueDate={a.due_date} />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-5">
            <AnalyticsTab classId={id!} />
          </TabsContent>
        </Tabs>

        {/* Mobile FAB */}
        {isMobile && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            onClick={shareInvite}
          >
            <Share2 className="h-5 w-5" />
          </motion.button>
        )}
      </div>
    </AppLayout>
  );
};

function DueDateBadge({ dueDate }: { dueDate: string }) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return <span className="text-xs text-destructive font-medium">Overdue</span>;
  }
  if (diffDays === 0) {
    return <span className="text-xs text-amber-500 font-medium">Due today</span>;
  }
  if (diffDays <= 3) {
    return <span className="text-xs text-amber-500 font-medium">Due in {diffDays}d</span>;
  }
  return <span className="text-xs text-muted-foreground">{due.toLocaleDateString()}</span>;
}

function AnalyticsTab({ classId }: { classId: string }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [assignmentResults, setAssignmentResults] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [analyticsRes, progressRes, resultsRes, attendanceRes] = await Promise.all([
        supabase.rpc("get_class_analytics", { p_class_id: classId }),
        supabase.rpc("get_student_progress", { p_class_id: classId } as any),
        supabase.rpc("get_assignment_results", { p_class_id: classId } as any),
        supabase.rpc("get_attendance_grid", { p_class_id: classId } as any),
      ]);
      setAnalytics(analyticsRes.data);
      setStudentProgress(progressRes.data);
      setAssignmentResults(resultsRes.data);
      setAttendanceData(attendanceRes.data);
      setLoading(false);
    };
    fetchAll();
  }, [classId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!analytics?.success) return <p className="text-muted-foreground text-center py-12">Failed to load analytics</p>;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Students", value: analytics.enrollment_count },
          { label: "Assignments", value: analytics.assignment_count },
          { label: "Submissions", value: analytics.submission_count },
          { label: "Avg Score", value: analytics.average_score ?? "—" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="students" className="text-xs">Students</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs">Results</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClassAnalyticsCharts analytics={analytics} assignmentResults={assignmentResults?.assignments} />
        </TabsContent>

        <TabsContent value="students">
          <StudentProgressTable
            students={studentProgress?.students || []}
            assignmentResults={assignmentResults?.assignments}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentResultsPanel
            assignments={assignmentResults?.assignments || []}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceGrid
            students={attendanceData?.students || []}
            assignments={attendanceData?.assignments || []}
            attendance={attendanceData?.attendance || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ClassDetail;
