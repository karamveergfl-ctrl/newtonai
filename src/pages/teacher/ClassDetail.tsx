import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { InviteCodeCard } from "@/components/teacher/InviteCodeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, FileText, ClipboardList, BarChart3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

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
        // Fetch profile names
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
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{classInfo.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {classInfo.subject && <Badge variant="secondary">{classInfo.subject}</Badge>}
              {classInfo.academic_year && <Badge variant="outline">{classInfo.academic_year}</Badge>}
            </div>
            {classInfo.description && (
              <p className="text-muted-foreground mt-2">{classInfo.description}</p>
            )}
          </div>
          <InviteCodeCard code={classInfo.invite_code} />
        </div>

        <Tabs defaultValue="students">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" /> Students ({enrollments.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="h-4 w-4" /> Assignments ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            {enrollments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No students enrolled yet. Share the invite code!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {enrollments.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{e.profile?.full_name || "Unknown Student"}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(e.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeStudent(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            {loadingAssignments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{a.assignment_type}</Badge>
                          {a.is_published ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </div>
                      </div>
                      {a.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(a.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab classId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

function AnalyticsTab({ classId }: { classId: string }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc("get_class_analytics", { p_class_id: classId });
      setAnalytics(data);
      setLoading(false);
    };
    fetch();
  }, [classId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!analytics?.success) return <p className="text-muted-foreground text-center py-12">Failed to load analytics</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: "Students", value: analytics.enrollment_count },
        { label: "Assignments", value: analytics.assignment_count },
        { label: "Submissions", value: analytics.submission_count },
        { label: "Avg Score", value: analytics.average_score },
      ].map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ClassDetail;
